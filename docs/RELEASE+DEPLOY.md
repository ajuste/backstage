# Release & Deployment Process for `backstage`

## Workflow

This repository uses the `Release Branch Deployment Bundle` Bundle:
1. **Feature Branches**: A separate branch is created from the main branch for each new feature or bug fix. This is where all the development work happens.
1. **Code Review and Testing**: Once the feature is complete, the code is reviewed by other team members and thoroughly tested. This helps to maintain code quality and catch any potential issues early.
1. **Deploy to Staging**: After the code review and testing phase, the feature branch is deployed to the staging environment. This allows us to test the changes in a live environment before deploying them into production.
1. **Deploy to Production**: The feature branch is deployed to the production environment after the code review and testing phase. This allows us to test the changes in a live environment before they are merged into the main branch.
1. **Merge to Main**: Once the changes have been verified in production, the feature branch is merged back into the main branch. This is typically done through a pull request to ensure that at least one other team member has reviewed the changes.

This methodology allows us to work on multiple features simultaneously without affecting the stability of the main branch. It also ensures that every change in the main branch is reviewed, tested, and verified in production, reducing the chances of introducing bugs into the production environment.

## Environment Variables

The application requires the following environment variable to be set in the deployment environments (QA and Production):

- `AUTH_SECRET`: A secret key used for signing authentication tokens. This must be a securely generated, persistent secret.

## Deployment

### QA

Deploy using [Jenkins job](https://jenkins.zerofox.com/job/backstage-deploy-qa/)

### Staging

There is no staging environment.

### Production

Deploy using [Jenkins job](https://jenkins.zerofox.com/job/backstage-deploy-prod/)