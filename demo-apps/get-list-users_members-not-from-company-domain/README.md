# List External Users

Over time, users outside of your organization will be invited to participate in various meetings / workspaces. From a security perspective it is a good idea to periodically review the list of external users in order to determine if they still require access.

## Details
In this application, we will do just that: retrieve all users whose email domains don't match that of your company. For example, if your company email is `@mycompany.com`, the app will list all users whose email addresses do not end in "mycompany.com".

This can be done at an Instance level, or limited to a single Organization or Workspace.

## Command Line
The output can be saved as either a CSV or JSON file.

### Usage:

 `node get-external-users --token=<token> --emailDomain=<email domain> --outputTo=<path/file name to write to>
 [--filterBy=<ORG | WORKSPACE>]
 [--filterById=<Id of organization or workspace>] [--outputFormat=<CSV | JSON>]`

See `get-external-users.js` for further details.

**Notes:**

- Instead of providing the arguments on the command line, you can also hard-code them in the `get-external-users.js` file itself. For example, on the line:

  `const token = args.token ?? "<SET_TOKEN>";`

  You can replace `<SET_TOKEN>` with your authorization token and then omit the `--token=...` argument from the command line call.

- If you do not use the standard Bluescape U.S. Production instance then you will need to update the `apiPortalUrl` constant, found near the beginning of the `get-external-users.js` file, with the URL appropriate to your environment.

## Web Based
See the [README](./web-app/README.md) file under the `web-app` folder for details about a sample web UI for this app.

## Contact us

If you have any questions or comments, please contact us in our [Bluescape Community site](https://community.bluescape.com/c/developer/14).