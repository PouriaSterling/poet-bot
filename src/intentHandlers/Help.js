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
                    "value": "_\"What's JIRA_USERNAME working on?\"_",
                    "short": true
                },
                {
                    "value": "Search issues by status",
                    "short": true
                },
                {
                    "value": "_\"Show me Resolved issues\"_",
                    "short": true
                }
            ],
            "color": "warning",
            "mrkdwn_in": ["fields"]
        }
    ];
    SlackService.postMessage(event, text, attachments, token);
};
