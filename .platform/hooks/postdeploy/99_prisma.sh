#!/bin/bash
cd /var/app/current
source /opt/elasticbeanstalk/deployment/env
npm install --legacy-peer-deps --silent 2>&1 | tail -20
npx prisma generate --silent 2>&1 | tail -10
echo "Prisma Client regenerated successfully"
