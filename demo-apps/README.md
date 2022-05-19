# Bluespace Sample Apps

This repo contains sample apps to teach you how the Bluescape APIs work, for both REST and GraphQL APIs.
Please download this repo and run the different examples. Feel free to modify them to gain knowledge of the great functionality the Bluescape REST and GraphQL offer.

You can find more details about the Bluescape APIs, how to work with them, the differences between the REST and GraphQL, and use examples, in the [Bluescape Developer portal](https://developer.bluescape.com).

## Assumptions

- A Bluescape Application has been created. See how to do this in the [Application Registration page in the Bluescape Developer Portal](https://api.apps.us.bluescape.com/docs/page/appRegistration).
- You have created an Access Token to execute the APIs. See how to do this in the [Application Authorization page in the Bluescape Developer Portal](https://api.apps.us.bluescape.com/docs/page/app-auth).
- You have access to a workspace on Bluescape.

## Install

- See instructions in the folder of each application.

## Scripts

Name | APIs | Main steps to perform
---|---|---
[Upload content into a new canvas, in a grid display](./resize-new-canvas-when-uploading-content) | GraphQL | - A new Canvas is created, to upload a list of assets (by URL or from local drive) into a grid.<br>- The number of rows and columns for the grid is calculated on the number of assets to be uploaded.<br>- You can upload images, videos and documents.<br>- You provide an initial set of coordinates where to locate the Canvas, and the application verifies if the area needed for the Canvas and the assets to upload is empty or not.<br>- If the required area in the workspace is not empty, the application searches for an empty space and locates the Canvas there to avoid uploading the over content already present in the workspace.
[Retrieve text from all sticky notes](./get-all-sticky-notes-from-canvas-or-workspace) | GraphQL | - Specify the Id of the workspace and canvas (optional) to retrieve sticky note text from.<br>- Specify the file to write to and  the desired output format (CSV or JSON).
[List Bluescape users external to a company](./get-list-users_members-not-from-company-domain/) | GraphQL | - Available with both a command line and web-based user interface.<br>- The web UI includes a simple login page to obtain an access token.<br>- Specify the email domain for your company.<br>- Specify the file to write to and the desired output format (CSV or JSON).<br>- Provide an optional filter (by Organization or Workspace).
[Move an existing canvas and its contents to a new area in a workspace](./move-canvas-and-its-contents/) | GraphQL | - Specify the canvas to be moved and the direction to move it in.<br>- The nearest available space in the indicated direction will be identified.<br>- The canvas and all elements wholly contained within it will be moved to that new space.

## Contact us

If you have any question or comments, please contact us in our [Bluescape Community site](https://community.bluescape.com/).
