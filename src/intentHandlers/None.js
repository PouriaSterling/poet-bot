const SlackService = require('../services/SlackService.js');

module.exports.process = (event, token) => {
    SlackService.postError("I didn't quite understand your intent, can you try rephrasing your question? ", event, token);
};
