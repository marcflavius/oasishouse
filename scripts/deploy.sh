#!/usr/bin/env bash
# Deploys everything: DB migrations → edge functions → frontend.
#
# Usage:
#   ./scripts/deploy.sh                # full deploy to production (asks to confirm)
#   ./scripts/deploy.sh --preview      # deploy frontend to a Vercel preview URL
#   ./scripts/deploy.sh --skip-tests   # skip test suite (not recommended)
#   ./scripts/deploy.sh --skip-db      # skip supabase db push (schema unchanged)
#   ./scripts/deploy.sh --skip-fns     # skip edge-function deploy
#   ./scripts/deploy.sh --skip-web     # skip Vercel deploy
#   ./scripts/deploy.sh --yes          # non-interactive, don't ask for confirmation
#
# Requires:  supabase CLI, vercel CLI, deno, npm, and both projects already linked.

set -Eeuo pipefail

# ---------- paths / colors ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; BLUE=$'\033[0;34m'; DIM=$'\033[2m'; RESET=$'\033[0m'

info()  { printf "%s→ %s%s\n" "$BLUE"  "$*" "$RESET"; }
ok()    { printf "%s✓ %s%s\n" "$GREEN" "$*" "$RESET"; }
warn()  { printf "%s! %s%s\n" "$YELLOW" "$*" "$RESET"; }
die()   { printf "%s✗ %s%s\n" "$RED"   "$*" "$RESET" >&2; exit 1; }

# ---------- flags ----------
ENVIRONMENT="production"
SKIP_TESTS=false
SKIP_DB=false
SKIP_FNS=false
SKIP_WEB=false
ASSUME_YES=false

for arg in "$@"; do
  case "$arg" in
    --preview)     ENVIRONMENT="preview" ;;
    --skip-tests)  SKIP_TESTS=true ;;
    --skip-db)     SKIP_DB=true ;;
    --skip-fns)    SKIP_FNS=true ;;
    --skip-web)    SKIP_WEB=true ;;
    --yes|-y)      ASSUME_YES=true ;;
    -h|--help)     sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)             die "Unknown flag: $arg" ;;
  esac
done

# ---------- prerequisite check ----------
info "Checking prerequisites…"
command -v npm      >/dev/null || die "npm not found"
$SKIP_WEB || command -v vercel   >/dev/null || die "vercel CLI not found (npm i -g vercel)"
{ $SKIP_DB && $SKIP_FNS; } || command -v supabase >/dev/null || die "supabase CLI not found (brew install supabase/tap/supabase)"
$SKIP_TESTS || command -v deno   >/dev/null || die "deno not found (brew install deno) — needed for edge tests"

# Warn on dirty git tree (not fatal; user may deploy WIP intentionally)
if command -v git >/dev/null && [ -d .git ]; then
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    warn "Working tree has uncommitted changes."
  fi
fi

# ---------- confirmation ----------
echo
echo "  ${DIM}environment :${RESET} $ENVIRONMENT"
echo "  ${DIM}db push     :${RESET} $($SKIP_DB    && echo skipped || echo yes)"
echo "  ${DIM}fns deploy  :${RESET} $($SKIP_FNS   && echo skipped || echo yes)"
echo "  ${DIM}web deploy  :${RESET} $($SKIP_WEB   && echo skipped || echo yes)"
echo "  ${DIM}tests       :${RESET} $($SKIP_TESTS && echo skipped || echo yes)"
echo

if ! $ASSUME_YES; then
  read -r -p "Proceed with deploy? [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]] || die "Aborted."
fi

# ---------- tests (fail fast) ----------
if ! $SKIP_TESTS; then
  info "Running frontend tests…"
  npm run test --silent
  ok "Frontend tests passed"

  info "Running edge-function tests…"
  npm run test:edge --silent
  ok "Edge-function tests passed"
fi

# ---------- Supabase: migrations ----------
if ! $SKIP_DB; then
  info "Pushing DB migrations…"
  supabase db push
  ok "DB migrations applied"
fi

# ---------- Supabase: edge functions ----------
if ! $SKIP_FNS; then
  info "Deploying edge functions…"
  for fn in supabase/functions/*/; do
    name="$(basename "$fn")"
    [ "$name" = "_shared" ] && continue
    printf "  ${DIM}→ %s${RESET}\n" "$name"
    supabase functions deploy "$name"
  done
  ok "Edge functions deployed"
fi

# ---------- Frontend build check ----------
# Always type-check + build locally before uploading — Vercel will build too,
# but failing here saves a round trip and gives a clearer log.
if ! $SKIP_WEB; then
  info "Building frontend locally (type-check + vite build)…"
  npm run build --silent
  ok "Local build succeeded"

  info "Deploying to Vercel ($ENVIRONMENT)…"
  if [ "$ENVIRONMENT" = "production" ]; then
    vercel deploy --prod --yes
  else
    vercel deploy --yes
  fi
  ok "Vercel deploy triggered"
fi

echo
ok "Done."
