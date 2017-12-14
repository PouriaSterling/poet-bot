const SlackClient = require('../slackClient.js');

module.exports.process = (event, token, issueID) => {
    // TODO: Jira call
    const response = "Assignee of: " + issueID;
    return SlackClient.send(event, response, token);
};
