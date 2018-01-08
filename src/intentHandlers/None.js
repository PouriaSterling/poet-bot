const SlackClient = require('../slackClient.js');
const Error = require('../helpers/error.js');

module.exports.process = (event, token) => {
    Error.report("I didn't quite understand your intent, can you try rephrasing your question? ", event, token);
};
