const SlackClient = require('../slackClient.js');
const Jira = require('../jiraCalls/issueInfo.js');

module.exports.process = (event, token, issueID) => {
    Jira.process(issueID)
        .then((response) => respond(response, event, token, issueID))
        .catch(error => console.log("JiraErr: " + error));
};

const respond = (jiraResponse, event, token, issueID) => {
    const status = jiraResponse['fields']['status']['name'];

    const response = "*Status of " + issueID + '*\n>' + status;
    SlackClient.send(event, response, token);
};
