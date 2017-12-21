const SlackClient = require('../slackClient.js');
const Jira = require('../jiraCalls/assigneeInfo.js');
const Error = require('../error.js');


module.exports.process = (event, token, name) => {
    const jql = "assignee=" + name + " and status='in progress'";
    Jira.process(jql)
        .then((response) => respond(response, event, token, name))
        .catch(error => console.log("JiraErr: " + error));
};

const respond = (jiraResponse, event, token, name) => {
    // catch JIRA call errors
    if (jiraResponse['errorMessages']){
        Error.report("JIRA error: " + jiraResponse['errorMessages'], event, token);
        return;
    }

    console.log("res: " + JSON.stringify(jiraResponse));

    const numOfIssues = jiraResponse['total'];

    var text = name;
    var attachments = [];

    if (numOfIssues > 0){
        text += ` is working on ${numOfIssues} issue(s)`;
        for (i = 0; i < numOfIssues; i++){
            attachments[i] = {
                "title": jiraResponse['issues'][i]['key'],
                "color": "good"
            }
        }
    } else {
        text += " is not currently working on any issues";
    }

    SlackClient.send(event, text, attachments, token);
};
