# Creating a plugin

Please also refer to [official documentation](https://backstage.io/docs/plugins/).

There are two types of plugins, frontend and backend plugins. 

## Frontend plugins

These are the steps required to create a frontend plugin:

1. Create a new plugin using the tool `./node_modules/.bin/backstage-cli create-plugin`.
2. Once you finish the wizard, you will have a new plugin under `plugins/your-plugin-name`.
3. In order for backstage to recognize the plugin locally for local development,
   you need to cd into your `plugins/your-plugin-name` and run `yarn link`.
4. This will print the exact command you have to run
   in order to link the plugin to the app package.
5. Then go to your `package/app` and run the command printed in the previous step.
6. For the plugin to be recognized in production like environments, we need to
   replicate same steps on Dockerfile:
   * Open `Dockerfile` and under the section `# Register every plugin like this`
   * ```sh
      WORKDIR /builder/plugins/your-plugin-name
      RUN yarn link
      ```
   * Then under the section `# Link every frontend plugin from zerofox here` add
     the command that was output by step 3.
     ```sh
     # Link every backend plugin from zerofox here
     WORKDIR /builder/packages/app
     RUN yarn link "plugin-reporting"
     RUN yarn link "@internal/plugin-github-resource-fetcher"
     ...
     ...
     # <<< whatever command on step 3 output >>
     RUN yarn link "your-plugin-name"
     ```
7. Don't forget to register your plugin within backstage code
   (details in the [official docs](https://backstage.io/docs/plugins/)).

Following this steps, you can simply run `yarn start` on the root of the repo
and start developing.

### Writing tests

You will have to cd into the plugin folder and run yarn test. Some examples:

* [Mocking APIs](https://github.com/riskive/backstage/tree/master/plugins/reporting/src/components/CodeCoverageReportFetchComponent)
* [Testing components rendered](https://github.com/riskive/backstage/tree/master/plugins/reporting/src/components/CodeCoverageReportFetchComponent)
* [Setting up routes](https://github.com/riskive/backstage/tree/master/plugins/reporting/src/components/CodeCoverageReportFetchComponent)
* [Mocking dependencies](https://github.com/riskive/backstage/blob/master/plugins/github-resource-fetcher-backend/src/service/router.test.ts)

## Backend plugins

These are the steps required to create a backend plugin:

1. Create a new plugin using the tool `./node_modules/.bin/backstage-cli create-plugin --backend`.
2. Once you finish the wizard, you will have a new plugin under `plugins/your-plugin-name`.
3. In order for backstage to recognize the plugin locally for local development,
   you need to cd into your `plugins/your-plugin-name` and run `yarn link`.
4. This will print the exact command you have to run
   in order to link the plugin to the app package.
5. Then go to your `package/backend` and run the command printed in the previous step.
6. For the plugin to be recognized in production like environments, we need to
   replicate same steps on Dockerfile:
   * Open `Dockerfile` and under the section `# Register every plugin like this`
   * ```sh
      WORKDIR /builder/plugins/your-plugin-name
      RUN yarn link
      ```
   * Then under the section `# Link every backend plugin from zerofox here` add
     the command that was output by step 3.
     ```sh
     # Link every backend plugin from zerofox here
     WORKDIR /builder/packages/backend
     RUN yarn link "@internal/plugin-github-resource-fetcher-backend"
     RUN yarn link "@internal/plugin-reporting-common"
     RUN yarn link "@internal/plugin-reporting-backend"
     ...
     ...
     # <<< whatever command on step 3 output >>
     RUN yarn link "your-plugin-name"
     ```
7. Don't forget to register your plugin within backstage code
   (details in the [official docs](https://backstage.io/docs/plugins/)).

Following this steps, you can simply run `yarn start` on the root of the repo
and start developing.

### Writing tests

You will have to cd into the plugin folder and run yarn test. Some examples:

* [Mocking APIs](https://github.com/riskive/backstage/blob/master/plugins/github-resource-fetcher-backend/src/service/router.test.ts)
* [Mocking dependencies](https://github.com/riskive/backstage/blob/master/plugins/github-resource-fetcher-backend/src/service/router.test.ts)
