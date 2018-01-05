const axios = require('axios');

const jiraDetails = {
	name: process.env.JIRA_NAME,
	password: process.env.JIRA_PASSWORD,
	url: process.env.JIRA_URL,
	issue_endpoint: process.env.JIRA_ISSUE_ENDPOINT
};

module.exports.process = (issueID) => {
    ID = issueID.replace(/ /g, '');
    console.log('JIRA URL: ' + jiraDetails.url + jiraDetails.issue_endpoint + ID);
    return axios.get(jiraDetails.url + jiraDetails.issue_endpoint + ID, {
        auth: {
            username: jiraDetails.name,
            password: jiraDetails.password
        }
    })
    .then(response => {
        return response.data;
    })
    .catch(error => {
        return error.response.data;
    });
};