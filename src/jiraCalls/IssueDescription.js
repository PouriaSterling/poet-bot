const SlackClient = require('../slackClient.js');
const Jira = require('../jira.js');

module.exports.process = (event, token, issueID) => {
    // TODO: Jira call
    Jira.process(issueID)
        .then((response) => respond(response, event, token, issueID))
        .catch(error => console.log("JiraErr: " + error));
};

const respond = (jiraResponse, event, token, issueID) => {
    console.log(jiraResponse['fields']['description']);

    const desc = jiraResponse['fields']['description'];

    const response = "Description of: " + issueID + '\n' + desc;
    SlackClient.send(event, response, token);
};
