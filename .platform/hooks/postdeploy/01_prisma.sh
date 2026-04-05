#!/bin/bash
cd /var/app/current

echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Generating Prisma Client..."
npx prisma generate

echo "Post-deploy completed!"
