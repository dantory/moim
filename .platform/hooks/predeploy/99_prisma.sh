#!/bin/bash
set -euo pipefail

cd /var/app/staging

if [ -x /opt/elasticbeanstalk/bin/get-config ]; then
  export DATABASE_URL=$(/opt/elasticbeanstalk/bin/get-config environment -k DATABASE_URL)
fi

echo "Generating Prisma Client for Elastic Beanstalk..."
npx prisma generate
