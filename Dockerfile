FROM node:18-bullseye-slim

# (libsqlite3-dev, curl, ca-certificates, gnupg, lsb-release, update && apt-get install -y python3 python3-pip) can be removed when dropping docker (used for POC only)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libsqlite3-dev python3 build-essential procps make python3-pip git && \
    pip3 install mkdocs-techdocs-core==1.0.1 && \
    rm -rf /var/lib/apt/lists/* && \
    yarn config set python /usr/bin/python3

WORKDIR /builder
COPY . .
#RUN yarn install

# Register every plugin like this

WORKDIR /builder/plugins/reporting-common
RUN yarn link

WORKDIR /builder/plugins/reporting
RUN yarn link "@internal/plugin-reporting-common"
RUN yarn link

WORKDIR /builder/plugins/github-resource-fetcher-backend
RUN yarn link

WORKDIR /builder/plugins/github-resource-fetcher
RUN yarn link

WORKDIR /builder/plugins/zf-tech-insights-common
RUN yarn link

WORKDIR /builder/plugins/zf-tech-insights-backend
RUN yarn link "backstage-plugin-zf-tech-insights-common"
RUN yarn link

WORKDIR /builder/plugins/zf-tech-insights
RUN yarn link "backstage-plugin-zf-tech-insights-common"
RUN yarn link

WORKDIR /builder/plugins/reporting-backend
RUN yarn link "@internal/plugin-reporting-common"
RUN yarn link "backstage-plugin-zf-tech-insights-common"
RUN yarn link "@internal/plugin-zf-tech-insights-backend"
RUN yarn link


# Link every backend plugin from zerofox here
WORKDIR /builder/packages/backend
RUN yarn link "@internal/plugin-github-resource-fetcher-backend"
RUN yarn link "@internal/plugin-reporting-common"
RUN yarn link "@internal/plugin-reporting-backend"
RUN yarn link "backstage-plugin-zf-tech-insights-common"
RUN yarn link "@internal/plugin-zf-tech-insights-backend"

# Link every frontend plugin from zerofox here
WORKDIR /builder/packages/app
RUN yarn link "plugin-reporting"
RUN yarn link "@internal/plugin-github-resource-fetcher"
RUN yarn link "backstage-plugin-zf-tech-insights-common"
RUN yarn link "@internal/plugin-zf-tech-insights-backend"
RUN yarn link "backstage-plugin-zf-tech-insights"

RUN export NODE_OPTIONS=--max_old_space_size=16192
WORKDIR /builder
RUN yarn --verbose install && yarn tsc && yarn --verbose build:backend

WORKDIR /app
RUN cp /builder/yarn.lock /builder/package.json /builder/packages/backend/dist/skeleton.tar.gz ./
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

RUN yarn install --frozen-lockfile --production --network-timeout 300000 && rm -rf "$(yarn cache dir)"
RUN cp /builder/packages/backend/dist/bundle.tar.gz /builder/app-config*.yaml ./
COPY ./data ./data
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz
RUN rm -rf /builder

EXPOSE 7007
EXPOSE 3000

CMD ["node", "packages/backend", "--config", "app-config.yaml"]