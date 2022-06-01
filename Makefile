backend-build:
	yarn install && yarn tsc && yarn build

build: backend-build

image: build
	yarn build-image