FROM node:16-bullseye-slim as builder

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends libsqlite3-dev python3 build-essential procps make && \
    rm -rf /var/lib/apt/lists/* && \
    yarn config set python /usr/bin/python3

COPY . .
RUN make backend-build

FROM node:16-bullseye-slim
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends libsqlite3-dev python3 build-essential procps make && \
    rm -rf /var/lib/apt/lists/* && \
    yarn config set python /usr/bin/python3
    
COPY --from=builder /app/yarn.lock /app/package.json /app/packages/backend/dist/skeleton.tar.gz ./
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

RUN yarn install --frozen-lockfile --production --network-timeout 300000 && rm -rf "$(yarn cache dir)"

# Then copy the rest of the backend bundle, along with any other files we might want.
COPY --from=builder /app/packages/backend/dist/bundle.tar.gz /app/app-config*.yaml ./
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

CMD ["node", "packages/backend", "--config", "app-config.yaml"]