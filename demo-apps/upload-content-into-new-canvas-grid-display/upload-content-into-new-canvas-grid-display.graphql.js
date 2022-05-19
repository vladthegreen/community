
/**
 * @license
 * Copyright 2022 Thought Stream, LLC dba Bluescape
 * Permission is hereby granted, free of charge, to any person obtaining a copy 
 * of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
 * subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS 
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
*/
/** 
 * Purpose:
 *  This demo app will create a new Canvas and will upload assets (Images, Videos or Documents) into this new Canvas. 
 *  The heigh and width of the canvas is calculated automatically depending on the number of assets to upload. 
 *  You need to provide a set of initial coordinates where to locate the canvas. Once the width and height of the canvas containing all the asset to upload is calculated, *  the demo app verifies if the is available empty space for the canvas on the specified coordinates. If not, 
 *  it looks for a available space moving to the right of the proposed initial coordinates (this direction can be changed in the app).        
 * 
 * Usage:
 *      node upload-content-into-new-canvas-grid-display.graphql.js --token=<token> --workspaceId=<workspaceId> --uploadMethod=<'URL'|'LOCAL'> 
 *                   [--pathToFiles='<path-to-assets-to-upload>/'] (when --uploadMethod='LOCAL')
 *                   [--assetsToUploadByUrl='<tab-delimited-list-if-urls-pointing-to-assets-to-upload>'] (when --uploadMethod='URL')
 *                   [--canvasName='<name for canvas>']
 *                   [--canvasPosition='(x_coordinate,y_coordinate)']
 * Requirements:
 *   - To install all the required libraries, run 'npm install' in both this folder and the ../bluescape-modules folder.
 *   - ffprobe needs to be installed in your system.
 *       - this is used to determine the height and width of the videos before uploading them into the workspace
 *       - Check https://www.npmjs.com/package/ffprobe-static#version-notes for the version to be installed.
 *       - You need to set the path to your local install of ffprobe in the ffprobePath variable in this script.
 *
 * Example of required parameters to use
 *  --uploadMethod=<'URL'|'LOCAL'>
 *  --pathToFiles='/Users/littlejohnny/assets/to-upload/'
 *  --assetsToUploadByUrl='https://s3.amazonaws.com/webclienttest.bluescape.com/share/images/landscape.jpg|https://s3.amazonaws.com/webclienttest.bluescape.com/share/images/18.jpg' 
 * 
 * Example of optional parameters to use:
 *  --canvasName='Test upload'
 *  --canvasPosition= '(1000,3000)'
 * 
 * Notes:
 *  To run this app against the entire instance requires that the token be
 *  generated by a user with Instance Admin privileges. A regular user can
 *  run the app when limiting the search to an Organization or Workspace,
 *  provided they can supply the necessary Id value.
 * 
 *  To obtain a token you can follow the instructions in the Application
 *  Authorization Guide found in the Developer Portal:
 *          https://api.apps.us.bluescape.com/docs/page/app-auth
 * 
 *  The Workspace Id can be obtained from the URL displayed in the browser.
 *  When you open a workspace the Id is the first value following the domain.
 *  For example, this URL includes the Workspace Id "bbKg00aNOelot2SkYno0":
 *    https://client.apps.us.bluescape.com/bbKg00aNOelot2SkYno0
 * 
 * You can specify the vertical alignment of the asset inside each cell: `top`, `center` or `bottom`. 
 *  Set this option in the `verticalCellAlignmnet` variable.
 * 
*/

import fs from 'fs';
import Yargs from "yargs";
import { filterAndPreProcessAssets } from '../bluescape-modules/uploadUtils.js';
import layoutAssetsInGrid from '../bluescape-modules/layoutImagesInGrid.js';

const now = new Date();

// APP PARAMETERS
const args = Yargs(process.argv.slice(2)).argv;
const apiURL = 'https://api.apps.us.bluescape.com';
const apiVersion = 'v3';
const workspaceId = args.workspaceId ?? '<SET_WORKSPACE_ID>';
const token = args.token ?? '<SET_TOKEN>';
const localFilesPath = args.pathToFiles ?? '<SET_FULL_PATH_TO_YOUR_LOCAL_FOLDER>'; // Remember to add the final '/' to the path
const uploadMethod = args.uploadMethod ?? "<SET_UPLOAD_METHOD>"; // "URL" or "LOCAL"
const assetsToUploadByURL = args.assetsToUploadByUrl ? args.assetsToUploadByUrl.split('|') : "<LIST_OF_TAB_DELIMITED_URLs>".split('|');
const canvasPosition = args.canvasPosition ?? '(0,0)';
const canvasName = args.canvasName ?? `UPLOADED CONTENT - ${now.toISOString()}`;
const ffprobePath = '<SET-FFPROBE-PATH>'; // Example: '/usr/local/bin/ffprobe' (depends on where it is installed in your system) 

// Default asset's width and height
const DEFAULT_ASSET_WIDTH = 1500;
const DEFAULT_ASSET_HEIGHT = 1500;

// Spacing between assets and between assets and the Canvas border
const HORIZONTAL_SPACING = 100;
const VERTICAL_SPACING = 100;

// Object to store the parameters for Bluescape API execution 
const bluescapeApiParams = {
    'token': token,
    'apiPortalUrl': apiURL,
    'apiVersion': apiVersion
}

/** 
    * Creates report of the upload process, printed out in the console.
    * @param {Object} uploadData - Object with the data for the asset attemped to be uplaoded and the result of the upload process
    * @param {Object} uploadData.newAsset - Object containing data for the asset that was attempet to be uploaded
    * @param {('video'|'image'|'document')} uploadData.newAsset.[assetType] - Type of the newly created asset: 'video', 'image' or 'document'. 
    *  It contains the id of the created element in the workspace 
    * @param {string} uploadData.newAsset.[assetType].id - Id of the newly created element
    * @param {Object} uploadData.newAsset.uploadResult - Object with data for the result of the upload process
    * @param {('success'|'failure')} uploadData.newAsset.uploadResult.result - Result of the upload process: 'success' or 'failure'
    * @param {string} uploadData.newAsset.uploadResult.assetPath - Path or full URL of the asset
    * 
    * @returns null
*/
async function generateUploadReport(uploadData) {

    const successfulUploads = [];
    const failedUploads = [];

    uploadData.map((uploadFromLocalResult) => {

        if (uploadFromLocalResult.newAsset.uploadResult.result === 'success') {
            successfulUploads.push(uploadFromLocalResult.newAsset.uploadResult.assetPath)
        } else {
            failedUploads.push(uploadFromLocalResult.newAsset.uploadResult.assetPath)
        }
    })

    const totalUploads = successfulUploads.length + failedUploads.length;

    console.log('-------------------------------------');
    console.log('UPLOAD REPORT');

    console.log(`Files attempted to upload: ${totalUploads}`);
    console.log(`   Successful uploads: ${successfulUploads.length} (${parseFloat((successfulUploads.length / totalUploads) * 100).toFixed(2)}%)`);
    successfulUploads.map((asset) => { console.log(`       ${asset} `) });
    console.log(`   Failed uploads: ${failedUploads.length} (${parseFloat((failedUploads.length / totalUploads) * 100).toFixed(2)}%)`);
    failedUploads.map((asset) => { console.log(`       ${asset} `) });

    return;
}

/**
 * Validates that mandatory arguments were supplied.
 */
function validateMandatoryArgs() {
    if (!token || token === "<SET_TOKEN>") {
        throw new ReferenceError("The token argument is required.");
    }

    if (!workspaceId || workspaceId === "<SET_WORKSPACE_ID>") {
        throw new ReferenceError("The workspaceId argument is required.");
    }

    if (!uploadMethod || uploadMethod === "<SET_UPLOAD_METHOD>") {
        throw new ReferenceError("The uploadMethod argument is required.");
    } else {
        if (uploadMethod !== 'URL' && uploadMethod !== 'LOCAL') {
            throw new ReferenceError("The uploadMethod argument must be 'URL' or 'LOCAL'.");
        }
        if (uploadMethod === 'URL' && (!assetsToUploadByURL || assetsToUploadByURL === '<LIST_OF_TAB_DELIMITED_URLs>'.split('|'))) {
            throw new ReferenceError("When using URL upload method, the assetsToUploadByURL argument is required");
        }
        if (uploadMethod === 'LOCAL' && (!localFilesPath || localFilesPath === '<SET_FULL_PATH_TO_YOUR_LOCAL_FOLDER>')) {
            throw new ReferenceError("When using upload from local drive method, the pathToFiles argument is required");
        }
    }
}

/** 
 *  Main Function.
 *  Bluescape sample app: get a list of assets to uplaod (by URL or from local drive), 
 *  The App will calculate the area the assets will occupy and will check for empty space 
 *  in the workspace to create a Canvas to contain all these assets. You can specify a starting (x,y) point 
 *  for the Canvas to be located.
 *  The assets will be evenly spaced in a grid display. 
 *  - The columns width will be set according to the widest asset to uplaod, and the height of the rows will be determinded by the tallest asset to upload.
 *       
 *  The upload can be from a local folder containing files to upload, or by a list of URLs pointing to assets to upload.
 *  Allowed extensions to upload into a workspace:
 *  - Images: jpeg, jpg, gif, png, tiff, tif
 *  - Documents: doc, docx, ppt, pptx, xls, xlsx, pdf
 *  - Videos: mp4, mov, m4v
*/
async function runAppExampleCreateCanvasAndUploadAsset() {

    try {

        validateMandatoryArgs();

        // Parse Canvas Coordinates, incoming format: '(x,y)'
        console.log(`Initial canvas Position Coordinates: ${canvasPosition} `);
        const positionNumbers = canvasPosition.replace(/[\(\)]/g, '').split(',');
        const canvasCoordinates = positionNumbers.map(strigNum => {
            return Number(strigNum)
        })

        // Create data object with the values to call the upload function
        // Using shorthand notation for variables, e.g. 'workspaceId": workspaceId -> workspaceId
        const layoutImagesInGridParams = {
            canvasCoordinates,
            'uploadMethod': uploadMethod,
            ffprobePath,
            workspaceId,
            canvasName,
            'directionToFindAvailableArea': 'right',
            defaultAssetDimensions: {
                DEFAULT_ASSET_WIDTH,
                DEFAULT_ASSET_HEIGHT
            },
            spacingBetweenAssets: {
                VERTICAL_SPACING,
                HORIZONTAL_SPACING
            },
            'verticalCellAlignmnet': 'center'
        }

        if (uploadMethod === "URL") {
            // -----------------------
            // UPLOAD BY URL
            // -----------------------

            // Pre-filter the URLs, to process only the ones with valid extensions for uploading
            const preFilteredURLs = await filterAndPreProcessAssets(assetsToUploadByURL);

            // Add the list of URLS for uplaod to the  layoutImagesInGridParams object
            layoutImagesInGridParams.assetsToUploadList = preFilteredURLs

            const uploadFromUrlProcessAnswer = await layoutAssetsInGrid(bluescapeApiParams, layoutImagesInGridParams);

            await generateUploadReport(uploadFromUrlProcessAnswer);

        }
        else if (uploadMethod === "LOCAL") {
            // -----------------------
            // UPLOAD FROM LOCAL
            // -----------------------

            // Check if the path exists
            fs.readdir(localFilesPath, async function (errorIssue, filesList) {
                if (errorIssue) {
                    return console.error(`ERROR: Unable to read directory "${localFilesPath}".Issue: ${errorIssue} `);
                } else {
                    const filesListFullPath = [];
                    filesList.map((fileName) => {
                        filesListFullPath.push(`${localFilesPath}${fileName}`);
                    })

                    // Pre-filter the files, to process only the ones with valid extensions for uploading
                    const preFilteredFiles = await filterAndPreProcessAssets(filesListFullPath);

                    // Add the list of URLS for uplaod to the  layoutImagesInGridParams object
                    layoutImagesInGridParams.assetsToUploadList = preFilteredFiles;

                    const uploadFromLocalProcess = await layoutAssetsInGrid(bluescapeApiParams, layoutImagesInGridParams);

                    await generateUploadReport(uploadFromLocalProcess);
                }
            });

        }
    } catch (error) {

        const buildErrorMessage = (e) =>
            `${e?.message ?? e} ${e?.extensions?.statusCode ? "(Status code: " + e.extensions.statusCode + ")" : ""} `;

        if (Array.isArray(error)) {
            console.error(`${error.length == 1 ? "An error" : "Errors"} occurred: `);
            for (const err of error) {
                console.error(buildErrorMessage(err));
            }
        }
        else {
            console.error(`An error occurred: ${buildErrorMessage(error)} `);
        }
        console.error(error?.stack ?? '');
    }

    return;
}

// Run the upload operation
runAppExampleCreateCanvasAndUploadAsset();