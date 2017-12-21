const axios = require('axios');

const jiraDetails = {
	name: process.env.JIRA_NAME,
	password: process.env.JIRA_PASSWORD,
	url: process.env.JIRA_URL,
	search_endpoint: process.env.JIRA_SEARCH_ENDPOINT
};

module.exports.process = (jql) => {
    console.log('JIRA URL: ' + jiraDetails.url + jiraDetails.search_endpoint);
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
        return error.response.data;
    });
};