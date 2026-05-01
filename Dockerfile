ARG NODE_VERSION=24.15.0-slim
FROM node:${NODE_VERSION}

WORKDIR /app

COPY . .

RUN \
  if [ -f yarn.lock ]; then \
    corepack enable yarn && yarn install --frozen-lockfile --production=false; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

RUN apt-get update \
  && apt-get install -y tini \
  && rm -rf /var/lib/apt/lists/*