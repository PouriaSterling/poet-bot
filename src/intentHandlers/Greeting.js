const SlackService = require('../services/SlackService.js');

module.exports.process = (event, token) => {
    const text = ":wave::smiley:";

    const greetings = ["Hey, I'm Poet! What can I help you with today?",
                       "Hi! I'm the [P]roject [O]riented [E]nlightenment [T]ool.\nAsk me something about JIRA.",
                       "_Poet is a tool_\n_That fetches JIRA data_\n_To keep devs happy_\n:dove_of_peace:\nWanna know something about JIRA?"];

    const randIndex = Math.floor(Math.random() * greetings.length);

    const attachments = [
        {
            "text": greetings[randIndex],
            "mrkdwn_in": ["text"],
            "color": "#32c8c8"
        },
        {
            "author_name": "You can always ask me for help!",
            "color": "#32c8c8"
        }
    ];
    SlackService.postMessage(event, text, attachments, token);
};
