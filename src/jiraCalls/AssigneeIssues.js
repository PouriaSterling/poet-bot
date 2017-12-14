const SlackClient = require('../slackClient.js');

module.exports.process = (event, token, name) => {
    // TODO: Jira call
    const response = "Issues of: " + name;
    return SlackClient.send(event, response, token);
};
