FROM node:16-bullseye-slim

# (libsqlite3-dev, curl, ca-certificates, gnupg, lsb-release, update && apt-get install -y python3 python3-pip) can be removed when dropping docker (used for POC only)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libsqlite3-dev python3 build-essential procps make python3-pip && \
    # REMOVE THIS LINE POC:
    pip3 install mkdocs-techdocs-core==1.0.1 && \
    rm -rf /var/lib/apt/lists/* && \
    yarn config set python /usr/bin/python3

WORKDIR /builder
COPY . .
RUN make backend-build

WORKDIR /app
RUN cp /builder/yarn.lock /builder/package.json /builder/packages/backend/dist/skeleton.tar.gz ./
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

RUN yarn install --frozen-lockfile --production --network-timeout 300000 && rm -rf "$(yarn cache dir)"
RUN cp /builder/packages/backend/dist/bundle.tar.gz /builder/app-config*.yaml ./
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz
RUN rm -rf /builder

EXPOSE 7007
EXPOSE 3000

CMD ["node", "packages/backend", "--config", "app-config.yaml"]