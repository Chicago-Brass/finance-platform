#!/bin/sh
set -eu

test_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_dir=$(CDPATH= cd -- "$test_dir/../.." && pwd)
set -- "$project_dir"/supabase/migrations/*.sql
if [ ! -f "$1" ]; then
  printf '%s\n' 'Expected ledger migrations.' >&2
  exit 1
fi
container_name="cb-ledger-payment-check-$$"
cleanup() {
  docker rm -f -v "$container_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT HUP INT TERM

# Isolated disposable database: loopback-only ephemeral port, no shared volumes or project credentials.
docker run --rm -d --name "$container_name" -p 127.0.0.1::5432 \
  -e POSTGRES_PASSWORD=local-only-ledger-check \
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
docker exec "$container_name" createdb -U postgres ledger_check
for file in "$test_dir/fixtures/supabase-platform.sql" "$@" "$project_dir/supabase/seed.sql"; do
  docker exec -i "$container_name" psql -X -q -v ON_ERROR_STOP=1 -U postgres -d ledger_check < "$file"
done
# Prove the Edge code writes tables directly; the existing financial trigger guards remain active.
docker exec "$container_name" psql -X -q -v ON_ERROR_STOP=1 -U postgres -d ledger_check \
  -c 'drop function public.create_journal_entry(jsonb,jsonb,boolean); drop function public.reverse_journal_entry(uuid,date,text);'
port=$(docker port "$container_name" 5432/tcp | sed 's/.*://')
LEDGER_TEST_DATABASE_URL="postgres://postgres:local-only-ledger-check@127.0.0.1:$port/ledger_check" \
  node --test "$test_dir/post-airtable-payment.test.mjs"
