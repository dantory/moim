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
escaped_database_url=$(node -p 'JSON.stringify(process.argv[1])' "$DATABASE_URL")
temp_prisma_config=.prisma-eb.config.ts

cat > "$temp_prisma_config" <<EOF
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: ${escaped_database_url},
  },
});
EOF
trap 'rm -f "$temp_prisma_config"' EXIT

echo "Applying Prisma migrations..."
npx prisma migrate deploy --config "$temp_prisma_config"
