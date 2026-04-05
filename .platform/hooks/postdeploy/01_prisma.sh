#!/bin/bash

cd /var/app/current

echo "[Post-deploy] Installing dependencies..."
npm install --legacy-peer-deps --silent 2>&1 | tail -20

echo "[Post-deploy] Generating Prisma Client..."
npx prisma generate --silent 2>&1 | tail -10

echo "[Post-deploy] Prisma Client regenerated successfully!"
