const SlackClient = require('../slackClient.js');

module.exports.process = (event, token, status) => {
    // TODO: Jira call
    const response = "Issues with status: " + status;
    return SlackClient.send(event, response, token);
};
