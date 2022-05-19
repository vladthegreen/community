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
import runGraphqlRequest from "../bluescape-modules/bluescapeApis.js";

/**
 * Returns a single page of external users retrieved based on the supplied
 * arguments.
 * 
 * The response is an object containing an array of users and the cursor value
 * to be supplied for the next page of results, if any exist.
 * For the first page of results, do not supply a value for the cursor argument.
 * @param {*} bluescapeApiParams The parameters required to make an API call: { token, apiPortalUrl, apiVersion }.
 * @param {*} emailDomain The corporate email domain. Users with email domains that do NOT match this will be returned.
 * @param {*} filterBy What to filter the results by (optional; valid values are ORG, WORKSPACE).
 * @param {*} filterById The Id of the Organization or Workspace to filter by (optional; required if filterBy is specified).
 * @param {*} pageSize The number of records to retrieve per page of data (optional; defaults to 100)
 * @param {*} cursor The cursor used to build the query for the next page of data (optional; omit for the first page).
 * @returns An object containing a page of user results, and a cursor to be used to retrieve the next page of data:
 *  {
 *      users: [ User ]
 *      cursor: String
 *  }
 */
export async function getExternalUsers(bluescapeApiParams, emailDomain, filterBy, filterById, pageSize, cursor) {

    const query = buildExternalUsersQuery(emailDomain, filterBy, filterById, pageSize, cursor);
    const response = await runGraphqlRequest(bluescapeApiParams, { requestQuery: query });

    return processExternalUsersResponse(response, filterBy);
}

/**
 * Retrieves the list of Organizations that the user is able to see in pages
 * of 100 records at a time.
 * 
 * The response is an object containing an array of organizations and the cursor
 * value to be supplied for the next page of results, if any exist.
 * For the first page of results, do not supply a value for the cursor argument.
 * @param {*} bluescapeApiParams The parameters required to make an API call: { token, apiPortalUrl, apiVersion }.
 * @param {*} cursor The cursor used to build the query for the next page of data (optional; omit for the first page).
 * @returns An object containing a page of organization results, and a cursor to be used to retrieve the next page of data:
 *  {
 *      orgs: Array of organization objects
 *      cursor: String
 *  }
 */
export async function getMyOrganizations(bluescapeApiParams, cursor) {

    let query = `query getMyOrganizations {
        me { `;

    if (!cursor) {
        query += `organizations (ordering: [ { field: name }, { field: secondaryName } ]
            pagination: { pageSize: 100 }) {`;
    }
    else {
        query += `organizations (cursor: "${cursor}") {`;
    }

    query += `
                results {
                    id
                    name
                    secondaryName
                }
                next
            }
        }
    }`;
    
    const response = await runGraphqlRequest(bluescapeApiParams, { requestQuery: query });

    return {
        orgs: response.data.data.me.organizations.results,
        cursor: response.data.data.me.organizations.next
    };
}

/**
 * Retrieves the list of Workspaces within an Organization in pages of 100 
 * records at a time.
 * 
 * The response is an object containing an array of workspaces and the cursor
 * value to be supplied for the next page of results, if any exist. For the
 * first page of results, do not supply a value for the cursor argument.
 * 
 * NOTE: At this time, this query can include workspaces that the user is not authorized to retrieve further details about.
 * @param {*} bluescapeApiParams The parameters required to make an API call: { token, apiPortalUrl, apiVersion }.
 * @param {*} orgId The Id of the organization whose workspaces should be retrieved.
 * @param {*} cursor The cursor used to build the query for the next page of data (optional; omit for the first page).
 * @returns An object containing a page of workspace results, and a cursor to be used to retrieve the next page of data:
 *  {
 *      workspaces: Array of workspace objects
 *      cursor: String
 *  }
 */
export async function getMyWorkspaces(bluescapeApiParams, orgId, cursor) {

    let query = `query getMyWorkspaces {
        me { `;
    
    if (!cursor) {
        query += `
            workspaces (filtering: { organizationId: { eq: "${orgId}" } }
                        ordering: [{ field: name }]
                        pagination: { pageSize: 100 }) {`;
    }
    else {
        query += `
            workspaces (cursor: "${cursor}") {`;
    }

    query += `
                results {
                    id
                    name
                    description
                    organization { id }
                }
            next
            }
        }
    }`;

    const response = await runGraphqlRequest(bluescapeApiParams, { requestQuery: query });

    return {
        workspaces: response.data.data.me.workspaces.results,
        cursor: response.data.data.me.workspaces.next
    };
}

/**
 * Builds the appropriate GraphQL query based on the specified arguments.
 * @param {*} emailDomain The corporate email domain. Users with email domains that do NOT match this will be returned.
 * @param {*} filterBy What to filter the results by (optional; valid values: ORG, WORKSPACE).
 * @param {*} filterById The Id of the Organization or Workspace to filter (optional; required if filterBy is specfied).
 * @param {*} pageSize The number of records to retrieve per page of data (optional; defaults to 100)
 * @param {*} cursor The cursor used to build the query for the next page of data (optional).
 * @returns The GraphQL query to be executed.
 */
function buildExternalUsersQuery(emailDomain, filterBy, filterById, pageSize, cursor) {
    if (filterBy) {
        if (filterBy === "ORG") {
            return buildOrgExternalUsersQuery(emailDomain, filterById, pageSize, cursor);
        }
        else if (filterBy === "WORKSPACE") {
            return buildWorkspaceExternalUsersQuery(emailDomain, filterById, pageSize, cursor);
        }
        else {
            throw new ReferenceError("The filterBy argument must be either 'ORG' or 'WORKSPACE'.");
        }
    }
    else {
        return buildInstanceExternalUsersQuery(emailDomain, pageSize, cursor);
    }
}

/**
 * Returns the query to retrieve external users from an Organization.
 * @param {*} emailDomain The corporate email domain. Users with email domains that do NOT match this will be returned.
 * @param {*} orgId The Id of the Organization to filter by.
 * @param {*} pageSize The number of records to retrieve per page of data (optional; defaults to 100)
 * @param {*} cursor The cursor used to build the query for the next page of data (optional).
 * @returns The GraphQL query to be executed.
 */
function buildOrgExternalUsersQuery(emailDomain, orgId, pageSize, cursor) {

    let membersArgs;
    if (cursor) {
        membersArgs = `cursor: "${cursor}"`;
    }
    else {
        membersArgs = `filtering: { user: { not: { email: { contains: "${emailDomain}" } } } } 
            pagination: { pageSize: ${pageSize ?? 100} }`;
    }

    const query = `query getOrgUsersNotFromDomain {
        organization (organizationId: "${orgId}") {
            members (${membersArgs}) {
                results {
                    user: member {
                        ... on User {
                            email
                            firstName
                            lastName
                            invitationStatus
                        }
                    }
                }
                totalItems
                prev
                next
            }
        }
    }`;

    return query;
}

/**
 * Returns the query to retrieve external users from a Workspace.
 * @param {*} emailDomain The corporate email domain. Users with email domains that do NOT match this will be returned.
 * @param {*} workspaceId The Id of the Workspace to filter by.
 * @param {*} pageSize The number of records to retrieve per page of data (optional; defaults to 100)
 * @param {*} cursor The cursor used to build the query for the next page of data (optional).
 * @returns The GraphQL query to be executed.
 */
function buildWorkspaceExternalUsersQuery(emailDomain, workspaceId, pageSize, cursor) {

    let collaboratorsArgs;
    if (cursor) {
        collaboratorsArgs = `cursor: "${cursor}`;
    }
    else {
        collaboratorsArgs = `filtering: { user: { not: { email: { contains: "${emailDomain}" } } } }
            pagination: { pageSize: ${pageSize ?? 100} }`;
    }

    const query = `query getWorkspaceUsersNotFromDomain {
        workspace (workspaceId: "${workspaceId}") {
            collaborators (${collaboratorsArgs}) {
                results {
                    user: collaborator {
                        ... on User {
                            email
                            firstName
                            lastName
                            invitationStatus
                        }
                    }
                }
                totalItems
                prev
                next
            }
        }
    }`;

    return query;
}

/**
 * Returns the query to retrieve external users from the Instance.
 * @param {*} emailDomain The corporate email domain. Users with email domains that do NOT match this will be returned.
 * @param {*} pageSize The number of records to retrieve per page of data (optional; defaults to 100)
 * @param {*} cursor The cursor used to build the query for the next page of data (optional).
 * @returns The GraphQL query to be executed.
 */
function buildInstanceExternalUsersQuery(emailDomain, pageSize, cursor) {

    let usersArgs;
    if (cursor) {
        usersArgs = `cursor: "${cursor}"`;
    }
    else {
        usersArgs = `filtering: { not: { email: { contains: "${emailDomain}" } } }
            pagination: { pageSize: ${pageSize ?? 100} }`;
    }

    const query = `query getUsersNotFromDomain {
        users (${usersArgs}) {
            results {
                email
                firstName
                lastName
                invitationStatus
            }
            totalItems
            prev
            next
        }
    }`;

    return query;
}

/**
 * Transforms the query results into a consistent format.
 * @param {*} response The response from the executed query.
 * @param {*} filterBy What to filter the results by (optional; valid values are ORG, WORKSPACE).
 * @returns An object containing the list of users and the cursors to be used
 *          to retrieve the next or previous page of data, if more data exists.
 */
function processExternalUsersResponse(response, filterBy) {
    let result = { users: null, userCount: 0, prevCursor: null, nextCursor: null };
    let meta = null;

    if (filterBy) {
        if (filterBy === "ORG") {
            result.users = flattenExternalUsersResults(response.data.data.organization.members.results);
            meta = response.data.data.organization.members;
        }
        else if (filterBy === "WORKSPACE") {
            result.users = flattenExternalUsersResults(response.data.data.workspace.collaborators.results);
            meta = response.data.data.workspace.collaborators;
        }
    }
    else {
        result.users = response.data.data.users.results;
        meta = response.data.data.users;
    }

    result.userCount = meta.totalItems;
    result.prevCursor = meta.prev;
    result.nextCursor = meta.next;

    return result;
}

/**
 * Removes the extra "user" object level that exists in some query results.
 * @param {*} results The array of user results containing an extra "user" object level.
 * @returns An array of user objects without an extra "user" object level.
 */
function flattenExternalUsersResults(results) {
    const users = results.map((user) => {
        return {
            email: user.user.email,
            firstName: user.user.firstName,
            lastName: user.user.lastName,
            invitationStatus: user.user.invitationStatus
        };
    });
    return users;
}
