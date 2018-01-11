const SlackService = require('../services/SlackService.js');
const JiraService = require('../services/JiraService.js');
const Utils = require('../services/Utils.js');

module.exports.process = (event, token, status) => {
    const jql = "status='" + status + "' ORDER BY updated DESC";
    JiraService.assigneeInfo(jql)
        .then((response) => respond(response, event, token, status))
        .catch(error => console.log("JiraErr: " + error));
};

const respond = (jiraResponse, event, token, status) => {
    // catch JIRA call errors
    if (jiraResponse['errorMessages']){
        SlackService.postError("JIRA error: " + jiraResponse['errorMessages'], event, token);
        return;
    }

    const numOfIssues = jiraResponse['total'];
    const limitResponsesTo = 10;

    var text = "There are ";
    var attachments = [];

    if (numOfIssues > 0){
        text += `${numOfIssues} issues with the status *${status.toUpperCase()}*`;
        if (numOfIssues > limitResponsesTo){
            text += ". Showing " + limitResponsesTo + " most recently updated results."
        }
        for (i = 0; i < Math.min(numOfIssues, limitResponsesTo); i++){
            var formattedDate = Utils.timeFromNow(jiraResponse['issues'][i]["fields"]['updated']);
            var title = `*${JiraService.HyperlinkJiraIssueID(jiraResponse['issues'][i]['key'])}* - *${jiraResponse['issues'][i]['fields']['summary']}*`;
            attachments[i] = {
//                "text": title,
//                "color": "good",
//                "mrkdwn_in": ["text"]
                "fields": [
                    {
                        "value": title,
                        "short": true
                    },
                    {
                        "value": `Updated ${formattedDate}`,
                        "short": true
                    }
                ],
                "color": "good",
                "mrkdwn_in": ["fields"]
            }
        }
    } else {
        text += `no issues with status *${status.toUpperCase()}*`;
    }

    SlackService.postMessage(event, text, attachments, token);
};
