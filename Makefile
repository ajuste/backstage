backend-build:
	yarn install && yarn tsc && yarn build

build: backend-build

image: build
	yarn build-image

ecr-login:
	aws ecr get-login-password --region us-west-2

image-deps: ecr-login
	docker build . --tag 012321959326.dkr.ecr.us-west-2.amazonaws.com/zf/backstage-deps:latest -f Dockerfile-deps
	docker push 012321959326.dkr.ecr.us-west-2.amazonaws.com/zf/backstage-deps:latest

reinstall-all-deps:
	find . -name 'node_modules' -type d && yarn install