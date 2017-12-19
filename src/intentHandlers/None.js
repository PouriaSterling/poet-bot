const SlackClient = require('../slackClient.js');

module.exports.process = (event, token, issueID) => {
    // TODO: handle errors
    const response = "Error: Your intention could not be found.";
    return SlackClient.send(event, response, token);
};
