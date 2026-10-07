# NEO web client for the una-ci Railway project, deployed as service `neo` next to `una`.
# .github/workflows/ci.yml uploads the `neo/` sources with this file and railway.toml
# added (scripts/railway/neo/), so the build context is the NEO root.
FROM node:24-slim

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Railway hands service variables to a Dockerfile build only as declared ARGs. The URLs are
# baked into the client bundle (NEXT_PUBLIC_*) and the image allowlist, so each environment
# builds its own image.
ARG UNA_URL
ARG NEXT_PUBLIC_UNA_URL
ARG APP_URL
ARG NEXT_PUBLIC_APP_URL

COPY . .

# yarn.lock isn't committed, so this resolves the package.json ranges like a fresh `yarn`;
# Tailwind is pinned in the root `resolutions`.
RUN corepack enable \
  && yarn install --non-interactive --network-timeout 600000 \
  && yarn build \
  && yarn cache clean

ENV NODE_ENV=production
WORKDIR /app/apps/next
# Railway sets PORT; listen on every interface so its proxy and private network reach it.
CMD ["sh", "-c", "exec node ../../node_modules/next/dist/bin/next start -H 0.0.0.0 -p ${PORT:-3000}"]
