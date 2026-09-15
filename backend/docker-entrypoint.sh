#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Running seed (idempotent - skips if data already exists)..."
node dist/prisma/seed.js

echo "Starting server..."
exec "$@"
