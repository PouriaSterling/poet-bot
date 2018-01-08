const SlackClient = require('../slackClient.js');
const Jira = require('../jiraCalls/assigneeInfo.js');
const Error = require('../helpers/error.js');
const Hyperlink = require('../helpers/hyperlink.js');


module.exports.process = (event, token, entity, entityType) => {
        if (entityType == "Self"){
            entity = event.user;
        }else if (entityType == "Mention"){
            entity = entity.toUpperCase();
        }
        SlackClient.GetFullName(entity, entityType, token)
            .then((fullName) => {
                if (fullName == 'NameNotFound'){
                    Error.report(`Error converting ${entity} to a username`, event, token)
                }else{
                    callJira(event, token, fullName);
                }
            })
            .catch(error => console.log("Conversion Error: " + error));
};

const callJira = (event, token, name) => {
    console.log(`Assignee name: ${name}`)
    const jql = "assignee=" + name + " and status='in progress'";
    Jira.process(jql)
        .then((response) => respond(response, event, token, name))
        .catch(error => console.log("JiraErr: " + error));
}

const respond = (jiraResponse, event, token, name) => {
    // catch JIRA call errors
    if (jiraResponse['errorMessages']){
        Error.report("JIRA error: " + jiraResponse['errorMessages'], event, token);
        return;
    }

    // catch JIRA call warnings
    if (jiraResponse['warningMessages']){
        Error.report("JIRA warning: " + jiraResponse['warningMessages'], event, token);
        return;
    }

    console.log("res: " + JSON.stringify(jiraResponse));

    const numOfIssues = jiraResponse['total'];

    var text = name.replace(/"/g, '');
    var attachments = [];

    if (numOfIssues > 0){
        text += ` is working on ${numOfIssues} issue(s)`;
        for (i = 0; i < numOfIssues; i++){
            attachments[i] = {
                "title": `${Hyperlink.jiraLink(jiraResponse['issues'][i]['key'])} - ${jiraResponse['issues'][i]['fields']['summary']}`,
                "color": "good"
            }
        }
    } else {
        text += " is not currently working on any issues";
    }

    SlackClient.postMessage(event, text, attachments, token);
};
