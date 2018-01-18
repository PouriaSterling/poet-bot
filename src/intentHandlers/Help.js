const SlackService = require('../services/SlackService.js');

module.exports.process = (event, token) => {
    const text = "Usage instructions :point_down:";
    const attachments = [
        {
            "title": "Ask me questions in natural language about JIRA. So far, I support the following types of questions:",
            "author_name": "Make sure to @mention me in your questions!",
            "color": "warning"
        },
        {
            "fields": [
                {
                    "title": "Type",
                    "value": "Issue Description",
                    "short": true
                },
                {
                    "title": "Example",
                    "value": "_\"What is the description of ISSUE-##?\"_",
                    "short": true
                },
                {
                    "value": "Issue Status",
                    "short": true
                },
                {
                    "value": "_\"What's the status of ISSUE-##?\"_",
                    "short": true
                },
                {
                    "value": "Issue Assignee",
                    "short": true
                },
                {
                    "value": "_\"Who's working on ISSUE-##?\"_",
                    "short": true
                },
                {
                    "value": "List the 'In Progress' issues for an assignee",
                    "short": true
                },
                {
                    "value": "_\"What's (Pouria Sterling || @pxsterling || pxsterling) working on?\"_",
                    "short": true
                },
                {
                    "value": "Search issues by status",
                    "short": true
                },
                {
                    "value": "_\"Show me Resolved issues\"_",
                    "short": true
                },
                {
                    "value": "Set the JIRA project for current Slack channel",
                    "short": true
                },
                {
                    "value": "_\"Set the project to POET\"_",
                    "short": true
                },
                {
                    "value": "Description of Slack channel's associated JIRA project",
                    "short": true
                },
                {
                    "value": "_\"Describe this project\"_",
                    "short": true
                }
            ],
            "color": "warning",
            "mrkdwn_in": ["fields"]
        },
        {
            "title": 'Remember to periodically log in to luis.ai and go to "Review endpoint utterances" to validate new utterances and "Train" Luis.',
            "color": "warning"
        },
        {
            "text": "Make me smarter! Go <https://github.com/PouriaSterling/poet-bot#adding-functionality|here>",
            "color": "warning"
        }
    ];
    SlackService.postMessage(event.channel, text, attachments, token);
};
