ARG NODE_VERSION=24.15.0-slim

# ----------- BUILDER
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY . .

RUN \
  if [ -f yarn.lock ]; then \
    corepack enable yarn && yarn install --frozen-lockfile --production=false; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

# ----------- RUNNER 
FROM node:${NODE_VERSION} AS runner

WORKDIR /app

COPY --from=builder /app /app

RUN corepack enable yarn \
  && apt-get update \
  && apt-get install -y tini \
  && rm -rf /var/lib/apt/lists/*