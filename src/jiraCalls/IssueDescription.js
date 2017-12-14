const SlackClient = require('../slackClient.js');

module.exports.process = (event, token, issueID) => {
    // TODO: Jira call
    const response = "Description of: " + issueID;
    return SlackClient.send(event, response, token);
};
