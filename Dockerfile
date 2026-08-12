FROM registry.access.redhat.com/ubi10/nodejs-22:1785789791 AS builder
ENV VITE_GITHUB_API=/proxy/github
ENV VITE_JIRA_PROXY=/proxy/jira

USER 1001
COPY --chown=1001 . .
RUN \
  npm clean-install --verbose --ignore-scripts --no-audit && \
  npm run build --workspace=client

FROM docker.io/library/caddy:2-alpine
COPY --from=builder /opt/app-root/src/client/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]

