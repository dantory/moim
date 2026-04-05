#!/bin/bash
set -euo pipefail

cd /var/app/current
source /opt/elasticbeanstalk/deployment/env 2>/dev/null || true

echo "Applying Prisma migrations..."
npx prisma migrate deploy
