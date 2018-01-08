const SlackClient = require('../slackClient.js');

module.exports.report = (errorMessage, event, token) => {
    SlackClient.postMessage(event, "Whoops :cry:",
        [
            {
                "title": errorMessage,
                "color": "danger",
                "mrkdwn_in": ["title"]
            }
        ],
        token);
};