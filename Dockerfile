FROM 012321959326.dkr.ecr.us-west-2.amazonaws.com/zf/backstage-deps:latest
WORKDIR /builder
COPY . .
#RUN yarn install

# Register every plugin like this
WORKDIR /builder/plugins/reporting
RUN yarn link

WORKDIR /builder/packages/app
# Link every plugin here:
RUN yarn link "plugin-reporting"

WORKDIR /builder
RUN yarn install && yarn tsc && yarn build

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