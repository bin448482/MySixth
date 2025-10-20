#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ACME_STAGE=staging ./deploy/certbot/request-cert.sh
#   ACME_STAGE=prod CERTBOT_EMAIL=ops@example.com ./deploy/certbot/request-cert.sh
#
# The script expects to run from the repository root.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

DOMAINS=(-d www.miidea.top -d miidea.top)
WEBROOT_ARGS=(--webroot -w /var/www/certbot)

ACME_STAGE="${ACME_STAGE:-staging}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

STAGE_ARGS=()
if [[ "${ACME_STAGE}" == "staging" ]]; then
  STAGE_ARGS+=(--staging --register-unsafely-without-email)
  echo "[certbot] Using Let's Encrypt staging endpoint."
else
  if [[ -z "${CERTBOT_EMAIL}" ]]; then
    echo "[certbot] Set CERTBOT_EMAIL when ACME_STAGE=prod." >&2
    exit 1
  fi
  STAGE_ARGS+=(--email "${CERTBOT_EMAIL}" --agree-tos)
fi

docker compose run --rm \
  certbot certonly \
  "${WEBROOT_ARGS[@]}" \
  "${DOMAINS[@]}" \
  "${STAGE_ARGS[@]}"
