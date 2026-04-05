#!/bin/bash
set -euo pipefail

cd /var/app/current
set -a
source /opt/elasticbeanstalk/deployment/env 2>/dev/null || true
set +a

echo "Applying Prisma migrations..."
npx prisma migrate deploy
