#!/usr/bin/env bash
#
# PostgreSQL backup script for Villa PMS
#
# Usage:
#   ./backup.sh
#
# Cron example (daily at 2:00 AM):
#   0 2 * * * /var/www/mira/server/scripts/backup.sh >> /var/log/mira/backup.log 2>&1
#
# Environment variables (or .env file):
#   DB_HOST     - PostgreSQL host (default: localhost)
#   DB_PORT     - PostgreSQL port (default: 5432)
#   DB_NAME     - Database name (default: villa_pms)
#   DB_USER     - Database user (default: villa_pms)
#   BACKUP_DIR  - Backup directory (default: /var/backups/villa-pms)
#   BACKUP_RETAIN_DAYS - Days to retain backups (default: 7)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env file if it exists
ENV_FILE="${SCRIPT_DIR}/../.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

# Configuration with defaults
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mira_db}"
DB_USER="${DB_USER:-mira}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/mira}"
BACKUP_RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-7}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/mira_backup_${TIMESTAMP}.sql.gz"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "[$(date --iso-8601=seconds)] Starting backup of database '${DB_NAME}'..."

# Run pg_dump with gzip compression
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"; then
  echo "[$(date --iso-8601=seconds)] Backup created: ${BACKUP_FILE} ($(du -h "$BACKUP_FILE" | cut -f1))"
else
  echo "[$(date --iso-8601=seconds)] ERROR: Backup failed" >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Remove backups older than retention period
DELETED=$(find "$BACKUP_DIR" -name "mira_backup_*.sql.gz" -type f -mtime +"$BACKUP_RETAIN_DAYS" -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$(date --iso-8601=seconds)] Cleaned up ${DELETED} backup(s) older than ${BACKUP_RETAIN_DAYS} days"
fi

echo "[$(date --iso-8601=seconds)] Backup complete"
exit 0
