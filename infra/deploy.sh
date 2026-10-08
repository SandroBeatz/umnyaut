#!/usr/bin/env bash
# Blue/green deploy on the VPS. Run as the deploy user from /srv/umnyaut.
#   ./deploy.sh deploy <image-tag>   start the tag in the idle slot, health-check, switch Caddy, stop the old slot
#   ./deploy.sh rollback             start the previous slot again and switch back to it
#   ./deploy.sh status               print slots and the active one
set -euo pipefail

cd "$(dirname "$0")"
STATE=state/release.env
UPSTREAM=state/upstream.caddy
HEALTH_TIMEOUT=${HEALTH_TIMEOUT:-90}

mkdir -p state
touch "$STATE"
# shellcheck disable=SC1090
source "$STATE"
ACTIVE=${ACTIVE:-}
BLUE_TAG=${BLUE_TAG:-unset}
GREEN_TAG=${GREEN_TAG:-unset}

log() { printf '[deploy] %s\n' "$*"; }
die() { printf '[deploy] ERROR: %s\n' "$*" >&2; exit 1; }

compose() {
  BLUE_TAG=$BLUE_TAG GREEN_TAG=$GREEN_TAG docker compose --profile slots "$@"
}

save_state() {
  printf 'ACTIVE=%s\nBLUE_TAG=%s\nGREEN_TAG=%s\n' "$ACTIVE" "$BLUE_TAG" "$GREEN_TAG" >"$STATE.tmp"
  mv "$STATE.tmp" "$STATE"
}

other() { [[ $1 == blue ]] && echo green || echo blue; }

tag_of() { [[ $1 == blue ]] && echo "$BLUE_TAG" || echo "$GREEN_TAG"; }

wait_healthy() {
  local slot=$1 id status
  id=$(compose ps -q "web-$slot")
  [[ -n $id ]] || die "web-$slot is not running"
  for ((i = 0; i < HEALTH_TIMEOUT; i += 3)); do
    status=$(docker inspect --format '{{.State.Health.Status}}' "$id")
    [[ $status == healthy ]] && return 0
    [[ $status == unhealthy ]] && break
    sleep 3
  done
  docker logs --tail 50 "$id" >&2 || true
  log "web-$slot did not become healthy (status: ${status:-unknown})"
  return 1
}

switch_to() {
  local slot=$1
  printf 'reverse_proxy web-%s:3000\n' "$slot" >"$UPSTREAM.tmp"
  mv "$UPSTREAM.tmp" "$UPSTREAM"
  if [[ -n $(compose ps -q caddy) ]]; then
    compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
  else
    compose up -d caddy
  fi
  log "traffic -> web-$slot ($(tag_of "$slot"))"
}

start_slot() {
  local slot=$1
  compose pull "web-$slot"
  compose up -d --no-deps --force-recreate "web-$slot"
  if ! wait_healthy "$slot"; then
    compose stop "web-$slot"
    die "web-$slot stopped; traffic stays on ${ACTIVE:-nothing}"
  fi
}

cmd_deploy() {
  local tag=${1:?usage: deploy.sh deploy <image-tag>}
  local next=blue
  [[ -n $ACTIVE ]] && next=$(other "$ACTIVE")
  if [[ $next == blue ]]; then BLUE_TAG=$tag; else GREEN_TAG=$tag; fi
  log "starting $tag in web-$next"
  start_slot "$next"
  local previous=$ACTIVE
  switch_to "$next"
  ACTIVE=$next
  save_state
  if [[ -n $previous ]]; then
    compose stop "web-$previous"
    log "stopped web-$previous (kept for rollback: $(tag_of "$previous"))"
  fi
}

cmd_rollback() {
  [[ -n $ACTIVE ]] || die "nothing deployed yet"
  local previous
  previous=$(other "$ACTIVE")
  [[ $(tag_of "$previous") != unset ]] || die "no previous release to roll back to"
  log "rolling back to $(tag_of "$previous") in web-$previous"
  compose up -d --no-deps "web-$previous"
  wait_healthy "$previous" || die "previous release is unhealthy; traffic stays on web-$ACTIVE"
  switch_to "$previous"
  compose stop "web-$ACTIVE"
  ACTIVE=$previous
  save_state
}

cmd_status() {
  printf 'active: %s\nblue:   %s\ngreen:  %s\n' "${ACTIVE:-none}" "$BLUE_TAG" "$GREEN_TAG"
  compose ps
}

case ${1:-} in
  deploy) shift; cmd_deploy "$@" ;;
  rollback) cmd_rollback ;;
  status) cmd_status ;;
  *) echo "usage: $0 deploy <image-tag> | rollback | status" >&2; exit 2 ;;
esac
