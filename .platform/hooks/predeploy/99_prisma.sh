#!/bin/bash
set -euo pipefail

cd /var/app/staging
source /opt/elasticbeanstalk/deployment/env 2>/dev/null || true

echo "Generating Prisma Client for Elastic Beanstalk..."
npx prisma generate
