const axios = require('axios');

const jiraDetails = {
	name: process.env.JIRA_NAME,
	password: process.env.JIRA_PASSWORD,
	url: process.env.JIRA_URL,
	issue_endpoint: process.env.JIRA_ISSUE_ENDPOINT,
	search_endpoint: process.env.JIRA_SEARCH_ENDPOINT,
	project_endpoint: process.env.JIRA_PROJECT_ENDPOINT,
	board_endpoint: process.env.JIRA_BOARD_ENDPOINT,
	rapidview_endpoint: process.env.JIRA_RAPIDVIEW_CONFIG_ENDPOINT,
	report_endpoint: process.env.JIRA_REPORT_INFO_ENDPOINT
};

// search the JIRA API using an issueID and return the response or throw and error
module.exports.issueInfo = (issueID) => {
    console.log('JIRA URL: ' + jiraDetails.url + jiraDetails.issue_endpoint + issueID);
    return axios.get(jiraDetails.url + jiraDetails.issue_endpoint + issueID, {
        auth: {
            username: jiraDetails.name,
            password: jiraDetails.password
        }
    })
    .then(response => {
        return response.data;
    })
    .catch(error => {
        console.log("Jira Error: " + error.response.data['errorMessages']);
        throw new Error(error.response.data['errorMessages']);
    });
};

// search the JIRA API using a JQL statement and return the response or throw and error
module.exports.assigneeInfo = (jql) => {
    console.log('JIRA URL: ' + jiraDetails.url + jiraDetails.search_endpoint + jql);
    return axios.get(jiraDetails.url + jiraDetails.search_endpoint , {
        params: {
            jql: jql
        },
        auth: {
            username: jiraDetails.name,
            password: jiraDetails.password
        }
    })
    .then(response => {
        return response.data;
    })
    .catch(error => {
        console.log("Jira Error: " + error.response.data['errorMessages']);
        throw new Error(error.response.data['errorMessages']);
    });
};

// search the JIRA API using a project key and return the response or throw and error
module.exports.projectInfo = (projectKey) => {
    console.log('JIRA URL: ' + jiraDetails.url + jiraDetails.project_endpoint + projectKey);
    return axios.get(jiraDetails.url + jiraDetails.project_endpoint + projectKey, {
        auth: {
            username: jiraDetails.name,
            password: jiraDetails.password
        }
    })
    .then(response => {
        return response.data;
    })
    .catch(error => {
        console.log("Jira Error: " + error.response.data['errorMessages']);
        throw new Error(error.response.data['errorMessages']);
    });
};

// get kanban board information using JIRA Agile APIs
module.exports.boardInfo = (query) => {
    console.log('JIRA URL: ' + jiraDetails.url + jiraDetails.board_endpoint + query);
    return axios.get(jiraDetails.url + jiraDetails.board_endpoint + query, {
        auth: {
            username: jiraDetails.name,
            password: jiraDetails.password
        }
    })
    .then(response => {
        return response.data;
    })
    .catch(error => {
        console.log("Jira Error: " + error.response.data['errorMessages']);
        throw new Error(error.response.data['errorMessages']);
    });
};

// get Rapidview config info for a kanban board from GreenHopper API
module.exports.rapidViewConfigInfo = (id) => {
    console.log('JIRA URL: ' + jiraDetails.url + jiraDetails.rapidview_endpoint + id);
    return axios.get(jiraDetails.url + jiraDetails.rapidview_endpoint + id, {
        auth: {
            username: jiraDetails.name,
            password: jiraDetails.password
        }
    })
    .then(response => {
        return response.data;
    })
    .catch(error => {
        console.log("Jira Error: " + error.response.data['errorMessages']);
        throw new Error(error.response.data['errorMessages']);
    });
};

// get report information from JIRA for control chart and cumulative flow diagram
module.exports.reportsInfo = (id) => {
    console.log('JIRA URL: ' + jiraDetails.url + jiraDetails.report_endpoint + id);
    return axios.get(jiraDetails.url + jiraDetails.report_endpoint + id, {
        auth: {
            username: jiraDetails.name,
            password: jiraDetails.password
        }
    })
    .then(response => {
        return response.data;
    })
    .catch(error => {
        console.log("Jira Error: " + error.response.data['errorMessages']);
        throw new Error(error.response.data['errorMessages']);
    });
};

// Given a JIRA issueID as input, return it as a Slack hyperlink
module.exports.HyperlinkJiraIssueID = (issueID) => {
    return `<${jiraDetails.url}/browse/${issueID}|${issueID}>`
};

// Given a JIRA Project key and desired text, return it as a Slack formatted hyperlink to project summary
module.exports.HyperlinkJiraProjectKey = (projectKey, text) => {
    return `<${jiraDetails.url}/projects/${projectKey}/summary|${text}>`
};