#!/bin/bash
set -euo pipefail

cd /var/app/current

if [ -x /opt/elasticbeanstalk/bin/get-config ]; then
  export DATABASE_URL=$(/opt/elasticbeanstalk/bin/get-config environment -k DATABASE_URL)
fi

echo "Applying Prisma migrations..."
npx prisma migrate deploy
