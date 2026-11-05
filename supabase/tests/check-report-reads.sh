#!/bin/sh
set -eu

test_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_dir=$(CDPATH= cd -- "$test_dir/../.." && pwd)
set -- "$project_dir"/supabase/migrations/*.sql
if [ ! -f "$1" ]; then
  printf '%s\n' 'Expected ledger migrations.' >&2
  exit 1
fi
container_name="cb-report-reads-check-$$"
cleanup() {
  docker rm -f -v "$container_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT HUP INT TERM

# Isolated disposable database: loopback-only ephemeral port, no shared volumes or project credentials.
docker run --rm -d --name "$container_name" -p 127.0.0.1::5432 \
  -e POSTGRES_PASSWORD=local-only-report-check \
  public.ecr.aws/supabase/postgres:17.11.0.004 \
  postgres -D /var/lib/postgresql/data -c listen_addresses='*' >/dev/null
attempt=0
until docker exec "$container_name" sh -c 'tr "\000" " " < /proc/1/cmdline | grep -q "/bin/postgres " && pg_isready -U postgres' >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    docker logs "$container_name"
    exit 1
  fi
  sleep 1
done
docker exec "$container_name" createdb -U postgres report_check
for file in "$test_dir/fixtures/supabase-platform.sql" "$@" "$project_dir/supabase/seed.sql"; do
  docker exec -i "$container_name" psql -X -q -v ON_ERROR_STOP=1 -U postgres -d report_check < "$file"
done
port=$(docker port "$container_name" 5432/tcp | sed 's/.*://')
REPORT_TEST_DATABASE_URL="postgres://postgres:local-only-report-check@127.0.0.1:$port/report_check" \
  node --test "$test_dir/report-reads.test.mjs"
