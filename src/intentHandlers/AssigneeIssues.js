const SlackService = require('../services/SlackService.js');
const JiraService = require('../services/JiraService.js');
const Utils = require('../services/Utils');

module.exports.process = (event, token, entity, entityType) => {
        if (entityType == "Self"){
            entity = event.user;
        }else if (entityType == "Mention"){
            entity = entity.toUpperCase();
        }
        SlackService.GetFullName(entity, entityType, token)
            .then((fullName) => {
                if (fullName == 'NameNotFound'){
                    SlackService.postError(`Error converting ${entity} to a username`, event, token)
                }else{
                    callJira(event, token, fullName);
                }
            })
            .catch(error => console.log("Conversion Error: " + error));
};

const callJira = (event, token, name) => {
    console.log(`Assignee name: ${name}`)
    const jql = "assignee=" + name + " and status='in progress' ORDER BY updated DESC";
    JiraService.assigneeInfo(jql)
        .then((response) => respond(response, event, token, name))
        .catch(error => console.log("JiraErr: " + error));
}

const respond = (jiraResponse, event, token, name) => {
    // catch JIRA call errors
    if (jiraResponse['errorMessages']){
        SlackService.postError("JIRA error: " + jiraResponse['errorMessages'], event, token);
        return;
    }

    // catch JIRA call warnings
    if (jiraResponse['warningMessages']){
        SlackService.postError("JIRA warning: " + jiraResponse['warningMessages'], event, token);
        return;
    }

    console.log("res: " + JSON.stringify(jiraResponse));

    const numOfIssues = jiraResponse['total'];

    var text = name.replace(/"/g, '');
    var attachments = [];

    if (numOfIssues > 0){
        text += ` is working on ${numOfIssues} issue(s)`;
        for (i = 0; i < numOfIssues; i++){
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
        text += " is not currently working on any issues";
    }

    SlackService.postMessage(event, text, attachments, token);
};
