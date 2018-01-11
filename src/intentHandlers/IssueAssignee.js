const SlackService = require('../services/SlackService.js');
const JiraService = require('../services/JiraService.js');

module.exports.process = (event, token, issueID) => {
    JiraService.issueInfo(issueID)
        .then((response) => respond(response, event, token, issueID))
        .catch(error => console.log("JiraErr: " + error));
};

const respond = (jiraResponse, event, token, issueID) => {
    // catch JIRA call errors
    if (jiraResponse['errorMessages']){
        SlackService.postError("JIRA error: " + jiraResponse['errorMessages'], event, token);
        return;
    }

    const assignee = jiraResponse['fields']['assignee']['displayName'];

    const text = `Assignee of ${JiraService.HyperlinkJiraIssueID(issueID)}`;
    const attachments = [
        {
            "title": assignee,
            "color": "good"
        }
    ];
    SlackService.postMessage(event, text, attachments, token);
};

