## What are we doing here?

This demo app will create a new Canvas and will upload assets (Images, Videos or Documents) into this new Canvas. 
The height and width of the canvas is calculated automatically depending on the number of assets to upload. 
You need to provide a set of initial coordinates where to locate the canvas. Once the width and height of the canvas containing all the assets to upload is calculated, the demo app verifies if there is available empty space for the canvas on the specified coordinates. If not, it looks for an available space moving to the right of the proposed initial coordinates (this direction can be changed in the app).

## This demo app is implemented using GraphQL APIs

This demo app uses GraphQL APIs on each of the steps to obtain information about assets to upload and to find available empty space for the canvas, and to create the canvas and upload the assets.

### How is the content displayed in the new Canvas?

- The assets will be positioned on horizontal rows, adding new assets to the right of the last one.
  - The number of rows and columns is calculated automatically, based on the number of assets.
  - - The assets are uploaded from left to right and top to bottom. For example, if you are uploading 6 assets, they will be uploaded in a 2 rows x 3 columns arrangement. Example:
    ```
    ----------------------   
    |asset1 asset2 asset3|
    |asset4 asset5 asset6|
    ----------------------
    ```
  - The current implementation uses a uniform width for columns and a uniform height for rows. The column width is calculated on the widest asset to upload, and the height of the rows is based on the tallest element to upload.
  - You can specify the vertical alignment of the asset inside each cell: `top`, `center` or `bottom`. Set this option in the `verticalCellAlignmnet` variable.

### What content can be uploaded?

- The content to upload can be: Images, Videos and Documents.
  - Allowed extensions for each type of asset:
    - Images: jpeg, jpg, gif, png, tiff, tif
    - Videos: mp4, mov, m4v
    - Documents: doc, docx, ppt, pptx, xls, xlsx, pdf
- The actual dimensions (width and height) of the Images and Videos is calculated and assigned to the uploaded assets into the workspace.

### What is the source of the assets to be uploaded?

- LOCAL: you can specify a local path in your drive from where the assets will be uploaded.
- URL: You can specify a list of URL links pointing to each asset you want to be uploaded.
  - These URLs must be publicly accessible (i.e. can be accessed from Internet).

## Requirements

### How to install required node libraries

Run `npm install` to install all the needed libraries.

### ffprobe

You will need to have `ffprobe` installed in your system to capture your video assets' actual width and height. The app will upload the video using their width and height. However, the videos might be displayed with different size (see in the "**How is the content displayed in the new Canvas?**" section).)

**IMPORTANT**: If you do not have `ffprobe` installed and its path set in the demo app, a default display width and height of 1500x1500 pixels will be assigned to the videos. Please note that the videos will not be stretched to fit these default dimensions, they will be visually scaled down to fit these dimensions. For example, if the original size of video is 200x200, it will not be scaled up to 1500x1500. However, if the original size of video is 3000x3000, it will be scaled down to 1500x1500.

1. Go to https://www.npmjs.com/package/ffprobe-static#version-notes for getting the right version of `ffprobe` to be installed in your system.
2. You need to set the path to your local install of `ffprobe` in the `ffprobePath` variable in the demo app.

### Modules to be used

This application uses a set of modules to implement its functionality. See the details of each module in [the modules folder.](./modules).

These modules can be reused into your own applications. Review this Demo App and the documentation in each module to see how to use them.

```
upload-content-into-new-canvas-grid-display.graphql.js
modules/
    bluescapeApis.js
    uploadAssetByURL.js
    uploadAssetFromLocal.js
    uploadUtils.js
```

## What are the main steps to be performed?

- Go over the list of assets to upload, and filter out the ones that are not allowed to be uploaded into the workspace.
- Calculate the number of rows and columns for the grid like display of the assets inside the new canvas.
- Calculate the position of each asset inside the grid like display.
- Calculate the width and height of the new canvas to create (to contain all the assets to be uploaded).
- Using the initially proposed position for the Canvas, find empty space in the Canvas to contain the Canvas to be created.
- Create a new Canvas: set its position and width/height.
- Upload content into the Canvas (provided by URL or from local drive): Images, Documents or Videos.

## Steps to follow

1. Pick a workspace where you want to see the result of executing this App.
2. Provide the values to run the script
    - In the demo app:
        - Go to the `// DEMO APP PARAMETERS` section
        - Set the values of the placeholders with this syntax: `<value-to-set>`. E.g.: `<SET_WORKSPACE_ID>` for the actual workspace Id.
    - By Command line. 
        - These values overwrite any value hardcoded in the app code:
        - Command line parameters to use:
        ```
        --uploadMethod=[URL|LOCAL]
        --pathToFiles='<PATH-TO-CONTENT-TO-UPLOAD>'
        --assetsToUploadByUrl='URL-1|URL-2|URL-3' 
        --token='<ACCESS-TOKEN>'
        --worksdpaceId=<SET_WORKSPACE_ID> 
        --canvasName='<CANVAS_NAME>' (Optional, default is "UPLOADED CONTENT -" plus the timestamp of the uplaod operation in GMT time)
        --canvasPosition='(x,y)' (Oprional, 'x' and 'y' are integers numbers. Default is (0,0) )
        ```
        - Example for upload by URL:
        ```
         --uploadmethod=URL
         --assetsToUploadByUrl='https://s3.amazonaws.com/webclienttest.bluescape.com/share/images/landscape.jpg|https://s3.amazonaws.com/webclienttest.bluescape.com/share/images/18.jpg'
        ```
        - Example for upload from local drive:
        ```
        --uploadMethod=LOCAL
        --pathToFiles='/Users/littlejohnny/assets/to-upload/'
        ```
3. Run the script
   - If you hardcoded the required values in the demo app, then run the demo app: 
     - `node upload-content-into-new-canvas-grid-display.graphql.js` 
   - If you want to pass command line parameters, then run `node upload-content-into-new-canvas-grid-display.graphql.js [command line parameters]`
     - examples:
       - Upload from local drive, into workspace `WTQHcY3tVb68fycvtpn9`, naming the canvas "Files upload #1":
         - sample execution call:
            ```
            node upload-content-into-new-canvas-grid-display.graphql.js --token='<SET-ACESS-TOKEN>' --pathToFiles='/Users/vladimirsanchez/temp/docs/other/' --uploadMethod=LOCAL --workspaceId=WTQHcY3tVb68fycvtpn9 --canvasName='Files upload #1'
            ```
       - Upload by URL, into workspace `WTQHcY3tVb68fycvtpn9`, naming the canvas "Files upload #2":
          - sample execution call:
            ```
            node upload-content-into-new-canvas-grid-display.graphql.js --token='<SET-ACESS-TOKEN>' --uploadMethod=LOCAL --assetsToUploadByUrl='https://s3.amazonaws.com/webclienttest.bluescape.com/share/images/landscape.jpg|https://s3.amazonaws.com/webclienttest.bluescape.com/share/images/18.jpg' --workspaceid=WTQHcY3tVb68fycvtpn9 --canvasName='Files upload #2'
            ```


