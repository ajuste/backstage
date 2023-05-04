AWS_REGION:=$(if $(AWS_REGION),$(AWS_REGION),us-west-2)
ENVIRONMENT:=qa
GIT_SHA:=$(shell git rev-parse --short=7 HEAD)
S3_BUCKET_PREFIX:=$(if $(S3_BUCKET_PREFIX),$(S3_BUCKET_PREFIX),zf-terraform)
TERRAFORM:=terraform

tf_files := $(shell find . -name "*.tf")

apply: terra.plan
	$(TERRAFORM) apply terra.plan

check-fmt:
	$(TERRAFORM) fmt -recursive -check=true

format: ${tf_files}
	$(TERRAFORM) fmt -recursive

clean:
	rm -f *.backup *.plan .terraform/terraform.tfstate

clobber: clean
	rm -rf .terraform

init: clobber
	$(TERRAFORM) init \
		-backend-config="bucket=$(S3_BUCKET_PREFIX)-$(ENVIRONMENT)" \
		-backend-config="region=$(AWS_REGION)"

terra.plan: ${tf_files}
	$(TERRAFORM) plan \
		-var "env=$(ENVIRONMENT)" \
		-var "git_sha=$(GIT_SHA)" \
		-out terra.plan

plan: terra.plan

validate: ${tf_files}
	$(TERRAFORM) validate

.PHONY: clean clobber init plan validate
