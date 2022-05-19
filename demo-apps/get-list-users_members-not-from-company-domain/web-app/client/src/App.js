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
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getExternalUsers, getMyOrganizations, getMyWorkspaces } from "get-external-users-cli/external-user-service";
import React from 'react';
import './App.css';

const apiPortalUrl = 'https://api.uat.alpha.dev.bluescape.io'; //'https://api.apps.us.bluescape.com'; // Change this to match your environment, if necessary
const apiVersion = 'v3';

/**
 * The search fields used to focus the search for external users.
 */
class SearchBar extends React.Component {
    /**
     * Component constructor
     * @param {*} props 
     */
    constructor(props) {
        super(props);

        this.handleEmailDomainChange = this.handleEmailDomainChange.bind(this);
        this.handleOrganizationIdChange = this.handleOrganizationIdChange.bind(this);
        this.handleWorkspaceIdChange = this.handleWorkspaceIdChange.bind(this);

        this.state = {
            orgs: [<option key="loading-org" value="">(Loading...)</option>],
            workspaces: [<option key="loading-ws" value="">(Loading...)</option>]
        };
    }

    /**
     * onChange event handler for the Email Domain field
     * @param {*} e 
     */
    handleEmailDomainChange(e) {
        this.props.onEmailDomainChange(e.target.value);
    }

    /**
     * onChange event handler for the Organization field
     * @param {*} e 
     */
     async handleOrganizationIdChange(e) {
        const orgId = e.target.value;

        if (orgId !== this.props.organizationId) {
            // Update the state in the parent component and load the list of workspaces for the selected org
            this.props.onOrganizationIdChange(orgId);
            await this.loadWorkspaces(e.target.value);
        }
    }

    /**
     * onChange event handler for the Workspace field
     * @param {*} e 
     */
    handleWorkspaceIdChange(e) {
        this.props.onWorkspaceIdChange(e.target.value);
    }

    /**
     * Retrieves the list of Organizations the user has access to.
     */
    async loadOrganizations() {
        let cursor = null;
        let orgs = [];
        let loading = "Loading...";

        while (true) {
            // Update the loading indicator in the field
            this.setState({ orgs: [<option key="loading-org" value="">({loading})</option>]});
            loading += ".";

            try {
                const bluescapeApiParams = buildBluescapeApiParams(this.props.token);
                const results = await getMyOrganizations(bluescapeApiParams, cursor);
                orgs.push(...results.orgs);

                if (results.cursor) {
                    cursor = results.cursor;
                }
                else {
                    break;
                }
            }
            catch (error) {
                handleError(error);
                break;
            }
        }

        // Update the state with the full list of orgs
        const optional = [ <option key="optional-org" value="">(Optional)</option> ];
        this.setState({ orgs: optional.concat(orgs.map((org) => (
            <option key={org.id} value={org.id} title={org.secondaryName}>{org.name}</option>
        ))) });
    }

    /**
     * Retrieves the list of Workspaces the user has access to within the specified
     * Organization.
     * NOTE: the current implementation of "getMyWorkspaces" can return entities
     * that the user does not have access to. For the moment they are being displayed
     * and, if chosen as part of the filter, will produce a 404 Not Found error when
     * trying to retrieve the list of users.
     * One work around for this would be to execute a "lite" query against each
     * workspace to verify that the user has access to each; however, this comes with
     * a fairly heavy performanc penalty.
     * @param {*} orgId 
     */
    async loadWorkspaces(orgId) {
        let cursor = null;
        let workspaces = [];
        let loading = "Loading...";

        while (true) {
            // Update the loading indicator in the field
            this.setState({ workspaces: [<option key="loading-ws" value="">({loading})</option>]});
            loading += ".";

            try {
                const bluescapeApiParams = buildBluescapeApiParams(this.props.token);
                const results = await getMyWorkspaces(bluescapeApiParams, orgId, cursor);
                workspaces.push(...results.workspaces);

                if (results.cursor) {
                    cursor = results.cursor;
                }
                else {
                    break;
                }
            }
            catch (error) {
                handleError(error);
                break;
            }
        }

        // Update the state with the full list of workspaces
        const optional = [ <option key="optional-ws" value="">(Optional)</option> ];
        this.setState({ workspaces: optional.concat(workspaces.map((ws) => (
            <option key={ws.id} value={ws.id} title={ws.description}>{ws.name}</option>
        ))) });
    }

    /**
     * Triggers the loading of the Organizations once the component has loaded.
     */
    async componentDidMount() {
        // If the list of orgs hasn't been retrieved yet then do so
        if (this.state.orgs[0].key === "loading-org") {
            await this.loadOrganizations();
        }
    }

    /**
     * Renders the Search fields
     */
    render() {
        const buttonText = !this.props.submitDisabled
                            ? <label>Submit</label>
                            : <FontAwesomeIcon icon={faCircleNotch} spin />;

        return (
            <div className="simpleTable">
                <span>Email Domain:</span>
                <span><input type="text" placeholder="@yourdomain.com" onChange={this.handleEmailDomainChange} value={this.props.emailDomain} /></span>

                <span>Organization:</span>
                <span><select onChange={this.handleOrganizationIdChange} value={this.props.organizationId}>{this.state.orgs}</select></span>

                <span className={ this.props.organizationId ? null : "hidden" }>Workspace:</span>
                <span className={ this.props.organizationId ? null : "hidden" }>
                    <select onChange={this.handleWorkspaceIdChange} value={this.props.workspaceId}>{this.state.workspaces}</select>
                </span>

                <span>&nbsp;</span>
                <span><button disabled={this.props.submitDisabled} onClick={this.props.onSubmit}>{buttonText}</button></span>
            </div>
        );
    }
}

/**
 * Paging controls for moving through pages of users.
 */
class PagingControls extends React.Component {
    /**
     * Component constructor.
     * @param {*} props 
     */
    constructor(props) {
        super(props);
        this.handlePageSizeChange = this.handlePageSizeChange.bind(this);
    }

    /**
     * onChange event handler for the Page Size field.
     * @param {*} e 
     */
    handlePageSizeChange(e) {
        this.props.onPageSizeChange(e.target.value);
    }

    /**
     * Renders the paging controls.
     */
    render() {
        const totalPages = Math.ceil(this.props.userCount / this.props.pageSize);
        const showPrevious = (this.props.pageNumber > 1);
        const showNext = (this.props.pageNumber < totalPages);

        return (
            <div>
                <button className={ showPrevious ? "" : "hidden" } onClick={this.props.onPreviousClick} style={{marginRight: "5px"}}>&lt; Previous</button>
                <span style={{ marginRight: "5px" }}>Page {this.props.pageNumber} of {totalPages}</span>
                <span>Page Size:&nbsp;</span>
                <select value={this.props.pageSize} onChange={this.handlePageSizeChange}>
                    <option key="10" value="10">10</option>
                    <option key="25" value="25">25</option>
                    <option key="50" value="50">50</option>
                    <option key="100" value="100">100</option>
                </select>
                <button className={ showNext ? "" : "hidden" } onClick={this.props.onNextClick} style={{marginLeft: "5px"}}>Next &gt;</button>
            </div>
        );
    }
}

/**
 * The results table to display the list of external users.
 */
class UserTable extends React.Component {
    /**
     * Renders the results table
     */
    render() {
        const lineNoStartAt = ((this.props.pageNumber - 1) * this.props.pageSize) + 1;
        const rows = [];

        this.props.users.forEach((user, index) => {
            rows.push(
                <tr key={index}>
                    <td>{lineNoStartAt + index}</td>
                    <td>{user.email}</td>
                    <td>{user.firstName}</td>
                    <td>{user.lastName}</td>
                    <td>{user.invitationStatus}</td>
                </tr>
            );
        });

        return (
            <div>
                <PagingControls
                    userCount = {this.props.userCount}
                    pageSize = {this.props.pageSize}
                    pageNumber = {this.props.pageNumber}

                    onPreviousClick = {this.props.onPreviousClick}
                    onNextClick = {this.props.onNextClick}
                    onPageSizeChange = {(pageSize) => this.props.onPageSizeChange(pageSize)}
                />

                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Email</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Invitation Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>
        );
    }
}

/**
 * The main page of the app after logging in.
 * This includes both the Search fields as well as the results table displaying
 * the list of external users.
 */
class ExternalUsersPage extends React.Component {
    /**
     * Component constructor
     * @param {*} props 
     */
    constructor(props) {
        super(props);

        this.handleEmailDomainChange = this.handleEmailDomainChange.bind(this);
        this.handleOrganizationIdChange = this.handleOrganizationIdChange.bind(this);
        this.handleWorkspaceIdChange = this.handleWorkspaceIdChange.bind(this);
        this.handlePreviousClick = this.handlePreviousClick.bind(this);
        this.handleNextClick = this.handleNextClick.bind(this);
        this.handlePageSizeChange = this.handlePageSizeChange.bind(this);

        this.state = {
            emailDomain: "",
            organizationId: "",
            workspaceId: "",

            submitDisabled: false,
            users: [],
            userCount: 0,

            prevCursor: "",
            nextCursor: "",
            pageSize: 25,
            pageNumber: 1
        };
    }

    /**
     * onChange event handler for the Email Domain field.
     * @param {*} emailDomain 
     */
    handleEmailDomainChange(emailDomain) {
        this.setState({ emailDomain: emailDomain, users: [], userCount: 0, prevCursor: "", nextCursor: "", pageNumber: 1 });
    }

    /**
     * onChange event handler for the Organization field.
     * @param {*} organizationId 
     */
    handleOrganizationIdChange(organizationId) {
        this.setState({ organizationId: organizationId, workspaceId: "", users: [], userCount: 0, prevCursor: "", nextCursor: "", pageNumber: 1 });
    }

    /**
     * onChange event handler for the Workspace field.
     * @param {*} workspaceId 
     */
    handleWorkspaceIdChange(workspaceId) {
        this.setState({ workspaceId: workspaceId, users: [], userCount: 0, prevCursor: "", nextCursor: "", pageNumber: 1 });
    }

    /**
     * onClick event handler for the Previous Page button.
     */
    handlePreviousClick() {
        const newPage = this.state.pageNumber - 1;
        this.setState({ pageNumber: newPage });
        this.getUsers(this.state.prevCursor);
    }

    /**
     * onClick event handler for the Next page button.
     */
    handleNextClick() {
        const newPage = this.state.pageNumber + 1;
        this.setState({ pageNumber: newPage });
        this.getUsers(this.state.nextCursor);
    }

    /**
     * onChange event handler for the Page Size field.
     * @param {*} pageSize 
     */
    handlePageSizeChange(pageSize) {
        this.setState({ pageSize: pageSize });
    }

    /**
     * Retrieves the users that match the specified criteria
     */
     async getUsers(cursor) {
        // Ensure the email domain is specified, all other fields are optional
        if (!this.state.emailDomain) {
            alert("Email Domain is required.");
            return;
        }

        // Disable the submit button and clear the list of users
        this.setState({ submitDisabled: true, users: [] });

        // Gather the supplied parameter values
        const bluescapeApiParams = buildBluescapeApiParams(this.props.token);
        const emailDomain = this.state.emailDomain;
        const filterBy = this.state.workspaceId ? "WORKSPACE" : (this.state.organizationId ? "ORG" : null);
        const filterById = filterBy === "WORKSPACE" ? this.state.workspaceId : (filterBy === "ORG" ? this.state.organizationId : null);
        const pageSize = this.state.pageSize;

        try {
            const results = await getExternalUsers(bluescapeApiParams, emailDomain, filterBy, filterById, pageSize, cursor);
            this.setState({
                users: results.users,
                prevCursor: results.prevCursor,
                nextCursor: results.nextCursor,
                userCount: results.userCount
            });
        }
        catch (error) {
            handleError(error);
        }
    
        // If no cursor was provided, then this is the first page of results
        if (!cursor) {
            this.setState({ pageNumber: 1 });
        }
        
        // Re-enable the submit button
        this.setState({ submitDisabled: false });
    }

    /**
     * Renders the main app page
     */
    render() {
        return (
            <div>
                <SearchBar
                    token = {this.props.token}

                    emailDomain = {this.state.emailDomain}
                    onEmailDomainChange = {(emailDomain) => this.handleEmailDomainChange(emailDomain)}

                    organizationId = {this.state.organizationId}
                    onOrganizationIdChange = {(organizationId) => this.handleOrganizationIdChange(organizationId)}

                    workspaceId = {this.state.workspaceId}
                    onWorkspaceIdChange = {(workspaceId) => this.handleWorkspaceIdChange(workspaceId)}

                    submitDisabled = {this.state.submitDisabled}
                    onSubmit = {() => this.getUsers(null)}
                />
                <br/>
                <UserTable
                    users = {this.state.users}
                    userCount = {this.state.userCount}

                    prevCursor = {this.state.prevCursor}
                    nextCursor = {this.state.nextCursor}
                    pageSize = {this.state.pageSize}
                    pageNumber = {this.state.pageNumber}

                    onPreviousClick = {this.handlePreviousClick}
                    onNextClick = {this.handleNextClick}
                    onPageSizeChange = {(pageSize) => this.handlePageSizeChange(pageSize)}
                />
            </div>
        );
    }
}

/**
 * The Login page.
 */
class LoginPage extends React.Component {
    /**
     * Component constructor.
     * @param {*} props 
     */
    constructor(props) {
        super(props);

        this.handleClientIdChange = this.handleClientIdChange.bind(this);
        this.handleRedirectUriChange = this.handleRedirectUriChange.bind(this);
        this.handleLoginClick = this.handleLoginClick.bind(this);

        // Default the Redirct Url field to the current url (remove trailing /)
        let redirectUri = window.location.href;
        if (redirectUri.endsWith("/")) {
            redirectUri = redirectUri.substring(0, redirectUri.length-1);
        }

        this.state = {
            clientId: "",
            redirectUri: redirectUri
        }
    }

    /**
     * onChange event handler for the Client Id field.
     * @param {*} e 
     */
    handleClientIdChange(e) {
        this.setState({ clientId: e.target.value });
    }

    /**
     * onChange event handler for the Redirect Url field.
     * @param {*} e 
     */
    handleRedirectUriChange(e) {
        this.setState({ redirectUri: e.target.value });
    }

    /**
     * onClick event handler for the Login button.
     * This follows the "manual" generation of an access token described in the
     * "Application Authorization" guide in the Developer Portal.
     * @param {*} e 
     */
    handleLoginClick(e) {
        // Validate that values have been provided
        if (this.state.clientId && this.state.redirectUri) {
            // Navigate to authorize url
            const url = `${apiPortalUrl}/authorize?response_type=token&client_id=${this.state.clientId}&redirect_uri=${this.state.redirectUri}`;
            window.location.href = url;

            // On successful authorization, we should be redirected back to this
            // same page with a valid access token in the url, which will result
            // in the main ExternalUsersPage component being displayed
        }
        else {
            alert("All fields are mandatory.");
        }
    }

    /**
     * Renders the login fields.
     */
    render() {
        return (
            <div className="simpleTable">
                <span>Client Id:</span>
                <span><input type="text" placeholder="" onChange={this.handleClientIdChange} value={this.state.clientId} size="40" /></span>

                <span>Redirect Url:</span>
                <span><input type="text" placeholder="" onChange={this.handleRedirectUriChange} value={this.state.redirectUri} size="40" /></span>

                <span>&nbsp;</span>
                <span><button onClick={this.handleLoginClick}>Login</button></span>
            </div>
        );
    };
}

/**
 * The main container for the app.
 * If the url doesn't include an access token from the authorization process then
 * the login "page" will be displayed, otherwise the main app "page" will be.
 */
class DemoApp extends React.Component {
    /**
     * Renders the app
     */
    render() {
        const hash = window.location.hash?.substring(1);
        const queryParams = new URLSearchParams(hash);
        const token = queryParams.get("access_token");

        if (token) {
            return (
                <div>
                    <ExternalUsersPage token={token} />
                </div>
            );
        }
        else {
            return (
                <div>
                    <LoginPage />
                </div>
            );
        }
    }
}

/**
 * Helper function to return the Bluescape API params object.
 * @param {*} token The authorization token to be used on the request.
 */
 function buildBluescapeApiParams(token) {
    return {
        'token': token,
        'apiPortalUrl': apiPortalUrl,
        'apiVersion': apiVersion
    };
}

/**
 * Helper function to parse and display an error message.
 * @param {*} error 
 */
function handleError(error) {
    let msg = "";
    const buildErrorMessage = (e) => 
        `${e?.message ?? e} ${e?.extensions?.statusCode ? "(Status code: " + e.extensions.statusCode + ")" : ""}`;

    if (Array.isArray(error)) {
        msg += `${error.length === 1 ? "An error" : "Errors"} occurred while processing:\n`;
        for (const err of error) {
            msg += buildErrorMessage(err) + "\n";
        }
    }
    else {
        msg = `An error occurred while processing: ${buildErrorMessage(error)}`;
    }

    alert(msg);
}

export default DemoApp;
