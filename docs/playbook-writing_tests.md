# Testing

Writing tests for backstage is pretty simple.
Browse to the project you are trying to test, for example:
1. `packages/app`
2. `packages/backend`
3. `plugins/reporting`

Run `yarn test` and you will see the tests running.

It will listen to changes in the source code and re run the tests.

## Writing tests for packages/app or frontend plugins examples

* [Mocking APIs](https://github.com/riskive/backstage/tree/master/plugins/reporting/src/components/CodeCoverageReportFetchComponent)
* [Testing components rendered](https://github.com/riskive/backstage/tree/master/plugins/reporting/src/components/CodeCoverageReportFetchComponent)
* [Setting up routes](https://github.com/riskive/backstage/tree/master/plugins/reporting/src/components/CodeCoverageReportFetchComponent)

## Writing tests for packages/backend or backend plugins

//TODO