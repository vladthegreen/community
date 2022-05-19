# List External Users - Web UI
This app demonstrates a functioning web UI that can be used to retrieve users who do not belong to a specific email domain. This can be used as part of a regular security audit process.

The app includes a login process as well as the ability to filter users by Organization and / or Workspace.

To run this app in a simple React development environment you must:

1. Run `npm install` in each of the following folders:
- /demo-apps/bluescape-modules
- /demo-apps/get-list-users_members-not-from-company-domain
- /demo-apps/get-list-users_members-not-from-company-domain/web-app/client
- /demo-apps/get-list-users_members-not-from-company-domain/web-app/server (optional)

2. a) Run `npm start` in the web-app/client folder. This will launch the React development environment and your browser should automatically open the login page at http://locahost:3000.

    b) Alternatively, you can run `npm start` in the web-app/server folder. This will *compile* the React web client, copy it into the Express server application, and start the web server (see the scripts in package.json). Now you can open your browser to http://localhost:3001 to see the app running there. This demonstrates how you can take your web client and use it outside of the React development environment.

Once the app is running you will need to register it with Bluescape as [described here](https://api.apps.us.bluescape.com/docs/page/app-auth#appendix1). Ensure the "OAuth redirect uri" field matches the location where the app is running (http://localhost:3000 or http://localhost:3001 by default) and ***does not*** end in a slash character.

On the login page:

- Provide the Client Id of the Application generated in Bluescape.

- Confirm the Redirect Url field matches the current page address as well as the value supplied when registering the application in Bluescape (again, ensure that it ***does not*** end in a slash character).

- Click the Login button.

- Follow the instructions in the authenticaion and authorization screens.

**Notes:**

- If you do not use the standard Bluescape U.S. Production instance then you will need to update the `apiPortalUrl` constant, found near the beginning of the `App.js` file, with the URL appropriate to your environment.
