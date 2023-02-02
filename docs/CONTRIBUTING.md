# Contributing

1. Fork this repository.
2. Make changes and test locally.
   - More details on `running locally` playbook.
   - **Important**: Never commit secrets. Secrets for local development can be 
   safely added under app-config.local.yaml since its ignored by git.
3. Write tests (refer to `running tests` playbook).
4. Create a PR and wait for service owner to review and merge.
5. Test on QA environment.
6. Deploy to production.