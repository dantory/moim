#!/bin/bash
# This runs during prebuild phase
cd /var/app/staging
source /opt/elasticbeanstalk/deployment/env 2>/dev/null || true

# Regenerate Prisma Client for the target platform
echo "Regenerating Prisma Client..."
npx prisma generate --silent 2>&1 | tail -10
echo "Prisma Client regenerated successfully"
