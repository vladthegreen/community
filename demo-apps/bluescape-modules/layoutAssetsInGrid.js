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

import runGraphqlRequest from './bluescapeApis.js';
import { getAssetDimensions } from './uploadUtils.js';
import uploadAssetByUrlIntoCanvasGraphql from './uploadAssetByURL.js';
import uploadAssetFromLocalIntoCanvasGraphql from './uploadAssetFromLocal.js'

/**
    * Calculates the position of the asset within each "cell" in the grid
    *   The number of columns and rows is calculated based on the number of elements to upload. 
    *   Current implementation: centered horizontally and vertically (default, or change value of 'verticalCellAlignmnet')
    * @param {Object} functionParams - Object with the data to execute this function:
    * @param {Object} functionParams.assetData - Data of the asset to upload
    * @param {number} functionParams.gridColumnWidth - Width of all columns
    * @param {number} functionParams.gridRowHeight - Height of all rows
    * @param {('top'|'center'|'bottom')} functionParams.verticalCellAlignmnet - Vertical alignment of the asset in the cell. Values: 'top', 'center', 'bottom'. Default is 'center'.
    *  
    * @returns {Object} Object with the new relative position of the asset in the canvas (from canvas position) and data from object.
    * @returns {Object} object.assetRelativePosition - Position of the asset, relative to the position of the canvas 
    * @returns {number} object.assetRelativePosition.x - x coordinate for the asset
    * @returns {...assetData} object...assetData - data of the asset to upload 
*/
export async function calculateAssetPositionInGrid(functionParams) {

    const assetData = functionParams.assetData;
    const gridColumnWidth = functionParams.gridColumnWidth;
    const gridRowHeight = functionParams.gridRowHeight;
    const spacingValues = functionParams.spacingValues;

    // Assumption: all columns have the same width, all rows have the same height
    const cellPositionX = assetData.column * gridColumnWidth;
    const cellPositionY = assetData.row * gridRowHeight;

    // Center horizontally
    const assetRelativeX = Math.floor((gridColumnWidth - assetData.assetDimensions.width) / 2);

    // Vertical alignment
    var assetRelativeY = 0;
    if (functionParams?.verticalCellAlignmnet === 'top') {
        assetRelativeY = 0;
    } else if (functionParams?.verticalCellAlignmnet === 'bottom') {
        assetRelativeY = gridRowHeight - assetData.assetDimensions.height;
    } else {
        // Default: center
        assetRelativeY = Math.floor((gridRowHeight - assetData.assetDimensions.height) / 2);
    }

    const assetRelativePosition = {
        'x': cellPositionX + assetRelativeX + spacingValues.HORIZONTAL_SPACING,
        'y': cellPositionY + assetRelativeY + spacingValues.VERTICAL_SPACING
    }

    return {
        assetRelativePosition,
        ...assetData
    }
}

/**
    * Calculates the number of rows and columns for the grid like display of assets, to contain all ot those elements.
    *    It uses the number of assets to upload for this calculation.
    * @param {number} numberOfElements - Number of assets to upload.
    * 
    * @returns {Object} Object with number of columns and rows to use or create:
    * @returns {number} object.columns - Number of columns to use or create
    * @returns {number} object.rows - Number of rows to use or create
    *   
*/
function getColumnsAndRows(numberOfElements) {
    let rows = Math.floor(Math.sqrt(numberOfElements))
    let columns = Math.ceil(numberOfElements / rows)

    return { "columns": columns, "rows": rows }
}

/**
    * Uploads a list of assets inside a new canvas, in a grid display.
    * - The original dimensions (width and height) of the assets are maintained once uploaded into the canvas
    * - The function calculates automatically the number of rows and columns to use to display the assets
    * - The canvas width and height is determined by the number of rows and columns, 
    *   and the height of the rows is determined by the heigh of the tallest asset (plus spacing to separate the assets), 
    *   while the width of the columns is determined by the width of the widest asset (plus spacing to separate the assets)
    *  
    * @param {Object} bluescapeApiParams - Object containing the data for executing Bluescape APIs:
    * @param {string} bluescapeApiParams.token -  Access Token (oauth2 token, see https://api.apps.us.bluescape.com/docs/page/app-auth)
    * @param {string} bluescapeApiParams.apiPortalUrl - URL to the portal to execute the APIs, e.g. "https://api.apps.us.bluescape.com/api"
    * @param {string} bluescapeApiParams.apiVersion - Version of the APIs to be executed, e.g.: "v3". Current version: v3
    *   
    * @param {Object} parameterValues - Object with the parameter values to execute the function
    * @param {[number,number]} parameterValues.canvasCoordinates - Proposed coordinates for the Canvas creation. Format: [x,y] 
    * @param {('URL'|'LOCAL')} parameterValues.uploadMethod - Upload method: 'URL' or 'LOCAL'
    * @param {string} parameterValues.ffprobePath - Path to ffprobe, to calculate the width and height of video assets
    * @param {string} parameterValues.workspaceId - Workspace Id of workspace where the assets will be uploaded
    * @param {string} parameterValues.canvasName: Name to assign to the Canvas
    * @param {('up'|'down'|'left'|'right')} parameterValues.directionToFindAvailableArea - Direction used for the findAvailablerArea API to find empty space for the canvas to be created
    * @param {Object} parameterValues.defaultAssetDimensions - Object with default width and height to set to an asset if those values cannot be read directly from the asset
    * @param {number} parameterValues.defaultAssetDimensions.DEFAULT_ASSET_WIDTH - Default width for an asset
    * @param {number} parameterValues.defaultAssetDimensions.DEFAULT_ASSET_HEIGHT - deafult height for an asset
    * @param {Object} parameterValues.spacingBetweenAssets - Object with values for default spacing between assets, and from the Canvas border when they are uploaded into the canvas in a grid like display
    * @param {number} parameterValues.spacingBetweenAssets.VERTICAL_SPACING - Vertical spacing between assets and from assets to the top and bottom borders of the canvas
    * @param {number} parameterValues.spacingBetweenAssets.HORIZONTAL_SPACING - Horizontal spacing between assets and from the left and right borders of the canvas
    * @param {('top'|'center'|'bottom')} parameterValues.verticalCellAlignmnet - Vertical alignment in cells: default: 'center'. Values: 'top', 'center', 'bottom'
    * 
    * @returns {Object} Object with the data for the asset attemped to be uploaded and the result of the upload process
    * @returns {Object} object.newAsset - Object containing data for the asset that was attempet to be uploaded
    * @returns {('video'|'image'|'document')} object.newAsset.[assetType] - Type of the newly created asset: 'video', 'image' or 'document'.It is an object that contains the id of the created element in the workspace 
    * @returns {string} object.newAsset.[assetType].id - Id of the newly created element
    * @returns {Object} object.newAsset.uploadResult - Object with the data for the result of the upload process
    * @returns {('success'|'failure')} object.newAsset.uploadResult.result - Result of the upload process: 'success' or 'failure'
    * @returns {string} object.newAsset.uploadResult.assetPath - Path or full URL of the asset
    *   
*/
export default async function layoutAssetsInGrid(bluescapeApiParams, parameterValues) {

    // Minimum spacing between assets and bewtween assets and Canvas borders
    const HORIZONTAL_SPACING = parameterValues?.spacingBetweenAssets?.HORIZONTAL_SPACING ?? 100;
    const VERTICAL_SPACING = parameterValues?.spacingBetweenAssets?.VERTICAL_SPACING ?? 100;

    // Default width and heigth if those values cannot be retrieved
    const DEFAULT_ASSET_WIDTH = parameterValues?.defaultAssetDimensions?.DEFAULT_ASSET_WIDTH ?? 1500;
    const DEFAULT_ASSET_HEIGHT = parameterValues?.defaultAssetDimensions?.DEFAULT_ASSET_HEIGHT ?? 1500;


    var canvasCoordinates = {
        'x': parameterValues.canvasCoordinates[0],
        'y': parameterValues.canvasCoordinates[1]
    };
    const uploadMethod = parameterValues.uploadMethod;
    const assetsToUploadList = parameterValues.assetsToUploadList;

    const gridColumnsAndRows = getColumnsAndRows(assetsToUploadList.length);

    // STEP: Get the dimensions (width and height) of each asset

    const getAssetsDimensionsPromisesArray = [];

    let rowCount = 0;
    let columnCount = 0;

    console.log(`Number of assets to upload: ${assetsToUploadList.length}`);
    console.log(`Grid to use to uplaod the assets: ${gridColumnsAndRows.columns} columns x ${gridColumnsAndRows.rows} rows`)

    assetsToUploadList.map((assetFileData) => {
        const fileData = assetFileData;

        const assetURL = fileData.assetName;

        const assetType = fileData.assetType;
        const assetExtension = fileData.assetExtension;

        // Parameters to calculate the 
        const getAssetDimensionsParams = {
            uploadMethod,
            assetType,
            assetExtension,
            assetName: fileData.assetName,
            'assetLocation': assetURL,
            'ffprobePath': parameterValues.ffprobePath,
            'defaultWidth': DEFAULT_ASSET_WIDTH,
            'defaultHeight': DEFAULT_ASSET_HEIGHT,
            'row': rowCount,
            'column': columnCount
        }

        getAssetsDimensionsPromisesArray.push(getAssetDimensions(getAssetDimensionsParams));

        // Update the count of columns and rows
        columnCount++;
        if (columnCount >= gridColumnsAndRows.columns) {
            columnCount = 0;
            rowCount++;
        }
    });

    // Execute the process to get the dimensions for each asset
    const assetsDimensions = await Promise.all(getAssetsDimensionsPromisesArray);

    // Get the maximum width and height on the assets dimensions, to define width and height of the rows and columns
    const assetsMaxWidth = Math.max(...assetsDimensions.map(asset => asset.assetDimensions.width));
    const assetsMaxHeight = Math.max(...assetsDimensions.map(asset => asset.assetDimensions.height));

    const calculatePositionPromiseArray = [];

    assetsDimensions.map((assetData) => {
        const paramsForGridPositionCalculation = {
            'assetData': assetData,
            'gridColumnWidth': assetsMaxWidth,
            'gridRowHeight': assetsMaxHeight,
            'spacingValues': {
                VERTICAL_SPACING,
                HORIZONTAL_SPACING
            },
            'verticalCellAlignmnet': parameterValues?.verticalCellAlignmnet ?? 'center'
        }
        calculatePositionPromiseArray.push(calculateAssetPositionInGrid(paramsForGridPositionCalculation));
    });
    const assetsPositionedInGrid = await Promise.all(calculatePositionPromiseArray);

    // Calculate Canvas width and height
    const canvasWidth = (HORIZONTAL_SPACING + assetsMaxWidth) * gridColumnsAndRows.columns + HORIZONTAL_SPACING;
    const canvasHeight = (VERTICAL_SPACING + assetsMaxHeight) * gridColumnsAndRows.rows + VERTICAL_SPACING;

    // STEP: Find empty space for the Canvas, use findAvailableArea
    const findAvailableAreaQuery =
        `query findAvailableArea($workspaceId: String!, $proposedArea: BoxInput!, $direction: FindAvailableAreaDirection!){
        findAvailableArea(workspaceId: $workspaceId , proposedArea: $proposedArea, direction: $direction) {
            x y width height
        }
    }`

    const findAvailableAreaParams = {
        'workspaceId': parameterValues.workspaceId,
        'proposedArea': {
            'width': canvasWidth,
            'height': canvasHeight,
            'x': canvasCoordinates.x,
            'y': canvasCoordinates.y
        },
        'direction': parameterValues.directionToFindAvailableArea
    }

    const requestParamsFindAvailableArea = {
        'requestQuery': findAvailableAreaQuery,
        'requestVariables': findAvailableAreaParams
    }

    const findAvailableAreaResponse = await runGraphqlRequest(bluescapeApiParams, requestParamsFindAvailableArea);

    const availableAreaFound = findAvailableAreaResponse?.data?.data?.findAvailableArea ?? undefined;

    if (availableAreaFound) {
        // Update (x,y) coordinates for the Canvas position using result from findAvailableArea
        canvasCoordinates.x = findAvailableAreaResponse.data.data.findAvailableArea.x;
        canvasCoordinates.y = findAvailableAreaResponse.data.data.findAvailableArea.y;

        console.log(`Available Area for Canvas found at: (${canvasCoordinates.x},${canvasCoordinates.y}) `);

    } else {
        throw "Error: Could not find available area for the Canvas"
    }

    // STEP: Create the Canvas
    const canvasCreationMutation =
        `mutation createCanvasExample($workspaceId: String!, $input: CreateCanvasInput!){
            createCanvas(workspaceId: $workspaceId, input: $input) {
                __typename
                name
                id
                transform { x y }
                style {width height}
            }
        }`

    const canvasParams = {
        'workspaceId': parameterValues.workspaceId,
        'input': {
            'name': parameterValues.canvasName,
            'transform': {
                'x': canvasCoordinates.x,
                'y': canvasCoordinates.y
            },
            'style': {
                'width': canvasWidth,
                'height': canvasHeight,
            }
        }
    }

    const requestParamsCreateCanvas = {
        'requestQuery': canvasCreationMutation,
        'requestVariables': canvasParams
    }

    const canvasCreationResponse = await runGraphqlRequest(bluescapeApiParams, requestParamsCreateCanvas);

    const canvasCreationData = canvasCreationResponse?.data?.data?.createCanvas?.id ?? undefined;

    // Now let's calculate the position of where to upload the assets
    if (canvasCreationData) {
        const uploadAssetsPromisesArray = [];

        assetsPositionedInGrid.map((assetToUploadData) => {

            // Calculate the absolute coordinates for the asset to be uploaded
            assetToUploadData.x = assetToUploadData.assetRelativePosition.x + canvasCoordinates.x;
            assetToUploadData.y = assetToUploadData.assetRelativePosition.y + canvasCoordinates.y;

            assetToUploadData.workspaceId = parameterValues.workspaceId;
            assetToUploadData.assetTitle = assetToUploadData.assetName;

            if (uploadMethod === 'URL') {
                // Upload from URL

                // Add extra data for URL upload
                assetToUploadData.assetURL = assetToUploadData.assetFileFullPath;

                uploadAssetsPromisesArray.push(uploadAssetByUrlIntoCanvasGraphql(bluescapeApiParams, assetToUploadData));
            } else if (uploadMethod === 'LOCAL') {
                // Upload from LOCAL

                // Add extra data for upload from Local
                assetToUploadData.assetFullPath = assetToUploadData.assetFileFullPath;

                uploadAssetsPromisesArray.push(uploadAssetFromLocalIntoCanvasGraphql(bluescapeApiParams, assetToUploadData));
            } else {
                throw `uploadmethod value '${uploadMethod}' is not allowed`;
            }
        })
        // Upload the assets
        const uploadedAssets = Promise.all(uploadAssetsPromisesArray);

        return uploadedAssets;
    } else {
        throw "Error creating the canvas";
    }
    return;
}
