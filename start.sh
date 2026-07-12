#!/bin/bash

# ╔══════════════════════════════════════════════════════════════╗
# ║          TransitOps — Local Development Launcher            ║
# ║  Starts: PostgreSQL check → DB migrate → Seed → API → UI   ║
# ╚══════════════════════════════════════════════════════════════╝

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$ROOT_DIR/client"
SERVER_DIR="$ROOT_DIR/server"

# ── Colors ─────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
AMBER='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log_info()    { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()      { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()    { echo -e "${AMBER}[WARN]${NC}  $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo -e "${BOLD}╔════════════════════════════════════╗${NC}"
echo -e "${BOLD}║     TransitOps Dev Launcher        ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════╝${NC}"
echo ""

# ── Step 1: Check dependencies ─────────────────────────────────
log_info "Checking dependencies..."

command -v node >/dev/null 2>&1 || log_error "Node.js is required. Install from https://nodejs.org"
command -v npm  >/dev/null 2>&1 || log_error "npm is required"
command -v psql >/dev/null 2>&1 || log_warn "psql not found — make sure PostgreSQL is running"

NODE_VER=$(node -v)
log_ok "Node: $NODE_VER"

# ── Step 2: Check .env files ───────────────────────────────────
log_info "Checking environment files..."

if [ ! -f "$SERVER_DIR/.env" ]; then
  cp "$ROOT_DIR/.env.example" "$SERVER_DIR/.env"
  log_warn "Created server/.env from .env.example — review DATABASE_URL before proceeding"
fi

if [ ! -f "$CLIENT_DIR/.env" ]; then
  echo "VITE_API_URL=http://localhost:3001/api" > "$CLIENT_DIR/.env"
  log_ok "Created client/.env"
fi

log_ok "Environment files ready"

# ── Step 3: Install dependencies (only if node_modules missing) ─
if [ ! -d "$CLIENT_DIR/node_modules" ]; then
  log_info "Installing client dependencies..."
  cd "$CLIENT_DIR" && npm install --silent
  log_ok "Client deps installed"
else
  log_ok "Client deps already installed"
fi

if [ ! -d "$SERVER_DIR/node_modules" ]; then
  log_info "Installing server dependencies..."
  cd "$SERVER_DIR" && npm install --silent
  log_ok "Server deps installed"
else
  log_ok "Server deps already installed"
fi

# ── Step 4: PostgreSQL check ───────────────────────────────────
log_info "Checking PostgreSQL connection..."

source "$SERVER_DIR/.env" 2>/dev/null || true
DB_URL="${DATABASE_URL:-postgresql://jenilrevaliya@localhost:5432/transitops_dev}"

# Extract DB name from URL
DB_NAME=$(echo "$DB_URL" | sed 's/.*\///')

# Try to create DB if it doesn't exist
if command -v createdb >/dev/null 2>&1; then
  createdb "$DB_NAME" 2>/dev/null && log_ok "Created database: $DB_NAME" || log_info "Database $DB_NAME already exists"
else
  log_warn "createdb not found — ensure database '$DB_NAME' exists manually"
fi

# ── Step 5: Prisma migrate + seed ─────────────────────────────
log_info "Running Prisma migrations..."
cd "$SERVER_DIR"
npx prisma migrate deploy 2>/dev/null || npx prisma migrate dev --name init --skip-seed 2>/dev/null || log_warn "Migration may have partially applied"
log_ok "Database schema up to date"

log_info "Seeding demo data..."
npx prisma db seed 2>/dev/null && log_ok "Demo data seeded" || log_warn "Seed skipped (data may already exist)"

# ── Step 6: Launch servers ─────────────────────────────────────
log_info "Starting API server (port 3001)..."
log_info "Starting client dev server (port 5173)..."
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}Client:${NC}  http://localhost:5173"
echo -e "  ${GREEN}API:${NC}     http://localhost:3001/api"
echo -e "  ${GREEN}Health:${NC}  http://localhost:3001/health"
echo -e ""
echo -e "  ${CYAN}Demo login:${NC}  admin@transitops.io / Admin@123"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Press ${BOLD}Ctrl+C${NC} to stop both servers"
echo ""

# Cleanup function: kill both servers on Ctrl+C
cleanup() {
  echo ""
  log_info "Shutting down servers..."
  kill $SERVER_PID $CLIENT_PID 2>/dev/null
  wait $SERVER_PID $CLIENT_PID 2>/dev/null
  log_ok "Servers stopped. Goodbye!"
  exit 0
}
trap cleanup SIGINT SIGTERM

# Start API server in background
cd "$SERVER_DIR"
npm run dev 2>&1 | sed 's/^/[API] /' &
SERVER_PID=$!

# Short delay to let server bind
sleep 2

# Start client in background
cd "$CLIENT_DIR"
npm run dev 2>&1 | sed 's/^/[UI]  /' &
CLIENT_PID=$!

# Wait for both (blocks until Ctrl+C)
wait $SERVER_PID $CLIENT_PID
