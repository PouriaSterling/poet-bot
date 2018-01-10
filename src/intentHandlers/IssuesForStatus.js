const SlackClient = require('../slackClient.js');
const Jira = require('../jiraCalls/assigneeInfo.js');
const Error = require('../helpers/error.js');
const Hyperlink = require('../helpers/hyperlink.js');
const DateHelper = require('../helpers/dateHelper');

module.exports.process = (event, token, status) => {
    const jql = "status='" + status + "' ORDER BY updated DESC";
    Jira.process(jql)
        .then((response) => respond(response, event, token, status))
        .catch(error => console.log("JiraErr: " + error));
};

const respond = (jiraResponse, event, token, status) => {
    // catch JIRA call errors
    if (jiraResponse['errorMessages']){
        Error.report("JIRA error: " + jiraResponse['errorMessages'], event, token);
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
            var formattedDate = DateHelper.timeFromNow(jiraResponse['issues'][i]["fields"]['updated']);
            var title = `*${Hyperlink.jiraLink(jiraResponse['issues'][i]['key'])}* - *${jiraResponse['issues'][i]['fields']['summary']}*`;
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

    SlackClient.postMessage(event, text, attachments, token);
};
