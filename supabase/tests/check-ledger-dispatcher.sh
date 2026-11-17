#!/bin/sh
set -eu
project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
container_name="cb-ledger-dispatcher-check-$$"
trap 'docker rm -f -v "$container_name" >/dev/null 2>&1 || true' EXIT HUP INT TERM
docker run --rm -d --name "$container_name" -e POSTGRES_PASSWORD=local-only-ledger-check \
 public.ecr.aws/supabase/postgres:17.11.0.004 postgres -D /var/lib/postgresql/data \
 -c shared_preload_libraries=pg_net >/dev/null
attempt=0
until docker exec "$container_name" sh -c 'tr "\000" " " < /proc/1/cmdline | grep -q "/bin/postgres " && pg_isready -U postgres' >/dev/null 2>&1; do
 attempt=$((attempt+1)); [ "$attempt" -lt 30 ] || exit 1; sleep 1
done
docker exec "$container_name" createdb -U postgres ledger_check
docker exec -i "$container_name" psql -X -q -v ON_ERROR_STOP=1 -U postgres -d ledger_check < "$project_dir/supabase/tests/fixtures/supabase-platform.sql"
docker exec "$container_name" psql -X -q -v ON_ERROR_STOP=1 -U supabase_admin -d ledger_check -c 'create schema extensions; create extension supabase_vault; create extension pg_net with schema extensions;'
for file in supabase/migrations/20261108230411_ledger_daily_runs.sql supabase/migrations/20261117145919_production_ledger_dispatcher.sql supabase/migrations/20261117151534_align_ledger_dispatcher_clock.sql supabase/migrations/20261117151815_guard_production_cron_created_date.sql supabase/migrations/20261117203734_fixed_scheduled_ledger_start.sql; do
 docker exec -i "$container_name" psql -X -q -v ON_ERROR_STOP=1 -U postgres -d ledger_check < "$project_dir/$file"
done
docker exec -i "$container_name" psql -X -q -v ON_ERROR_STOP=1 -U supabase_admin -d ledger_check < "$project_dir/supabase/tests/fixtures/ledger-dispatcher.sql"
