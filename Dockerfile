# FROM node:16-bullseye-slim as builder

# WORKDIR /app

# RUN apt-get update && \
#     apt-get install -y --no-install-recommends libsqlite3-dev python3 build-essential procps make && \
#     rm -rf /var/lib/apt/lists/* && \
#     yarn config set python /usr/bin/python3



FROM node:16-bullseye-slim
WORKDIR /app
COPY . .

# (libsqlite3-dev, curl, ca-certificates, gnupg, lsb-release, update && apt-get install -y python3 python3-pip) can be removed when dropping docker (used for POC only)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libsqlite3-dev python3 build-essential procps make python3-pip && \
    # REMOVE THIS LINE POC:
    pip3 install mkdocs-techdocs-core==1.0.1 && \
    rm -rf /var/lib/apt/lists/* && \
    yarn config set python /usr/bin/python3

RUN make backend-build

# docker begin
# RUN mkdir -p /etc/apt/keyrings
# RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
# RUN echo \
#   "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
#   $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
# RUN apt-get update
# RUN apt-get -y --no-install-recommends install docker-ce
# # docker end
    
# COPY /app/yarn.lock /app/package.json /app/packages/backend/dist/skeleton.tar.gz ./
RUN cp /app/packages/backend/dist/skeleton.tar.gz ./
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz


#?
RUN yarn install --frozen-lockfile --production --network-timeout 300000 && rm -rf "$(yarn cache dir)"

# Then copy the rest of the backend bundle, along with any other files we might want.
# COPY /app/packages/backend/dist/bundle.tar.gz /app/app-config*.yaml ./
RUN cp /app/packages/backend/dist/bundle.tar.gz ./
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

EXPOSE 7007
EXPOSE 3000
EXPOSE 8080

CMD ["node", "packages/backend", "--config", "app-config.yaml"]