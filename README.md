---
Service Owner:
  - Alvaro Juste (@ajuste)
Secondaries:
---

# Backstage

Developer portal based on [Backstage.io](https://backstage.io/)


# Local development

**Important**: Never commit secrets. Secrets for local development can be 
safely added under app-config.local.yaml since its ignored by git.

* Use app-config.local-skeleton.yaml to initialize content of app-config.local.yaml
* Register a backstage application under your github account
  following (this)[https://backstage.io/docs/auth/github/provider] instructions.
  **Important**: secrets can only be included **in**
* Make sure to add a new entry of your user under ./local/users.yaml
  that matches your github username.
* Running locally:
  * Developing features that **don't** require DB changes:
    * A memory DB is used.
    * In this case its suggested to run `yarn dev` directly on the root of the repo.
      This way you get hot reloads for changes on the react application.
  * Developing features that **requires** DB changes:
    * Hot reloads are not supported.
    * Usas a pgsql instance locally.
    * Run `docker-compose up local`
    * Backstage will be accessible under http://localhost:7007.