#!/bin/bash
set -euo pipefail

cd /var/app/current

if [ -z "${DATABASE_URL:-}" ] && [ -x /opt/elasticbeanstalk/bin/get-config ]; then
  DATABASE_URL=$(/opt/elasticbeanstalk/bin/get-config environment -k DATABASE_URL)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set for Prisma migrations" >&2
  exit 1
fi

export DATABASE_URL
export DOTENV_CONFIG_PATH=/tmp/prisma-eb.env
printf 'DATABASE_URL=%s\n' "$DATABASE_URL" > "$DOTENV_CONFIG_PATH"

echo "Applying Prisma migrations..."
npx prisma migrate deploy
