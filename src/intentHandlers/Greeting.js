const SlackService = require('../services/SlackService.js');

module.exports.process = (event, token) => {
    const text = ":wave::smiley:";

    const greeting = ["'Allo",
                      "'Allo 'Allo",
                      "Ahoy",
                      "G'day",
                      "Greetings",
                      "Hello",
                      "Hey there",
                      "Hey",
                      "Hi there",
                      "Hi",
                      "Hiya",
                      "How are things",
                      "How are ya",
                      "How ya doin'",
                      "How's it goin'",
                      "How's it going",
                      "How's life",
                      "Howdy",
                      "Sup",
                      "What's new",
                      "What's up",
                      "Yo",
                      "Bonjour",
                      "Good day",
                      "Aloha",
                      "Namaste",
                      "Howdy-do",
                      "Cheerio",
                      "Salute"];

    const introduction = ["I'm Poet!",
                          "I'm the [P]roject [O]riented [E]nlightenment [T]ool!",
                          "_Poet is a tool_\n_That fetches JIRA data_\n_To keep devs happy_\n:dove_of_peace:",
                          "I'm Poet and I'm getting smarter everyday!",
                          "I'm a Poet and I know it!",
                          "I'm the new and improved Poet bot!"];

    const usage = ["What JIRA stuff can I help you with today?",
                   "Ask me something about JIRA.",
                   "Ask me something regarding JIRA.",
                   "Wanna know something about JIRA?",
                   "Can I help you with something JIRA related?",
                   "I know a lot about your JIRA projects. Try asking me."];

    const rand1 = Math.floor(Math.random() * greeting.length);
    const rand2 = Math.floor(Math.random() * introduction.length);
    const rand3 = Math.floor(Math.random() * usage.length);

    const attachments = [
        {
            "text": greeting[rand1] + '!\n' + introduction[rand2] + '\n' + usage[rand3],
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
