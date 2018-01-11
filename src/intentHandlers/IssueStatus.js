const SlackService = require('../services/SlackService.js');
const JiraService = require('../services/JiraService.js');


module.exports.process = (event, token, issueID) => {
    JiraService.issueInfo(issueID)
        .then((response) => respond(response, event, token, issueID))
        .catch((error) => console.log("JirErr: " + error));
};

const respond = (jiraResponse, event, token, issueID) => {
    // catch JIRA call errors
    if (jiraResponse['errorMessages']){
        SlackService.postError("JIRA error : " + jiraResponse['errorMessages'], event, token);
        return;
    }

    const status = jiraResponse['fields']['status']['name'];

    const text = `Status of ${JiraService.HyperlinkJiraIssueID(issueID)}`;
    const attachments = [
        {
            "title": status,
            "color": "good"
        }
    ];
    SlackService.postMessage(event, text, attachments, token);
};
