#!/bin/bash
set -e

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting deployment process..."
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Running database migrations (timeout: 60s)..."

timeout 60 npm run db:push || {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: Database migration failed or timed out"
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] The application will not start. Please check:"
  echo "  - Database connectivity (DATABASE_URL)"
  echo "  - Schema changes in shared/schema.ts"
  echo "  - Render database service status"
  exit 1
}

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Migrations completed successfully"
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting application server..."
exec npm start
