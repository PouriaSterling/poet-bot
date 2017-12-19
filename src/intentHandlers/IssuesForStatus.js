const SlackClient = require('../slackClient.js');
const Jira = require('../jiraCalls/assigneeInfo.js');

module.exports.process = (event, token, status) => {
    const jql = "status='" + status + "' ORDER BY updated DESC";
    Jira.process(jql)
        .then((response) => respond(response, event, token, status))
        .catch(error => console.log("JiraErr: " + error));
};

const respond = (jiraResponse, event, token, status) => {
//    console.log("res: " + JSON.stringify(jiraResponse));

    const numOfIssues = jiraResponse['total'];
    const limitResponsesTo = 20;

    var response = "*There are ";

    if (numOfIssues > 0){
        response += numOfIssues + " issues with status _" + status + "_";
        if (numOfIssues > limitResponsesTo){
            response += ". Showing " + limitResponsesTo + " most recently updated results.*"
        }
        for (i = 0; i < Math.min(numOfIssues, limitResponsesTo); i++){
            response += '\n>' + jiraResponse['issues'][i]['key'];
        }
    } else {
        response += "no issues with status _" + status + "_*";
    }

    SlackClient.send(event, response, token);
};
