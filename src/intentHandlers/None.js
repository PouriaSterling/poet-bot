const SlackClient = require('../slackClient.js');
const Error = require('../error.js');

module.exports.process = (event, token, issueID) => {
    Error.report("I didn't quite understand your intent, can you try rephrasing your question? ", event, token);
};
