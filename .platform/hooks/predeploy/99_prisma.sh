#!/bin/bash
set -euo pipefail

cd /var/app/staging
set -a
source /opt/elasticbeanstalk/deployment/env 2>/dev/null || true
set +a

echo "Generating Prisma Client for Elastic Beanstalk..."
npx prisma generate
