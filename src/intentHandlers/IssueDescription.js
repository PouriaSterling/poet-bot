const SlackService = require('../services/SlackService.js');
const JiraService = require('../services/JiraService.js');
const j2s = require('jira2slack');

module.exports.process = (event, token, issueID) => {
    JiraService.issueInfo(issueID)
        .then((response) => respond(response, event, token, issueID))
        .catch((error) => console.log("JirErr: " + error));
};

const respond = (jiraResponse, event, token, issueID) => {
    // catch JIRA call errors
    if (jiraResponse['errorMessages']){
        SlackService.postError("JIRA error: " + jiraResponse['errorMessages'], event, token);
        return;
    }

    const summary = jiraResponse['fields']['summary'];
    const status = jiraResponse['fields']['status']['name'];
    const assignee = jiraResponse['fields']['assignee']['displayName'];
    var desc = jiraResponse['fields']['description'];
    if (!desc){
        desc = 'This ticken has no description.'
    }

    const text = `Description of ${JiraService.HyperlinkJiraIssueID(issueID)}`;
    const attachments = [
        {
            "title": summary,
            "fields": [
                {
                    "title": "Status",
                    "value": status,
                    "short": true
                },
                {
                    "title": "Assignee",
                    "value": assignee,
                    "short": true
                }
            ],
            "color": "good",
            "mrkdwn_in": ["fields"]
        },
        {
            "title": "Description",
            "text": j2s.toSlack(desc),
            "color": "good",
            "mrkdwn_in": ["text"]
        },
    ];
    SlackService.postMessage(event, text, attachments, token);
};
