#!/bin/bash
# This runs before the app is deployed
cd /var/app/staging
source /opt/elasticbeanstalk/deployment/env

# Install dependencies and regenerate Prisma Client
npm install --legacy-peer-deps --silent 2>&1 | tail -20
npx prisma generate --silent 2>&1 | tail -10
echo "Prisma Client regenerated successfully in predeploy hook"
