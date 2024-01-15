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

# Backend debugging

1. Run `yarn dev`
2. Open chrome and browser `chrome://inspect/#devices`
3. Add a breakpoint by adding a `debugger` statement in the code.
4. Click inspect on the item that shows under the path `backstage/packages/dist/main.js`
5. You will be able to see only the code from main.js, if you want to see other code
   with pretty print, click on `add sources +` and include your app/backend/node_modules folder.

# Frontend debugging

1. Run `yarn dev`
2. Add a breakpoint by adding a `debugger` statement in the code.
3. Open debugger tools in chrome.
4. Chrome will automatically stop at the breakpoint.