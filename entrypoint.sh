#!/bin/sh
if [ -n "$JIRA_EMAIL" ] && [ -n "$JIRA_API_TOKEN" ]; then
  export JIRA_AUTH_BASE64=$(printf '%s:%s' "$JIRA_EMAIL" "$JIRA_API_TOKEN" | base64 | tr -d '\n')
fi

JIRA_URL="${JIRA_URL:-https://redhat.atlassian.net}"
export JIRA_UPSTREAM="$JIRA_URL"
export JIRA_HOST=$(echo "$JIRA_URL" | sed 's|.*://||' | sed 's|/.*||')

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
