const SlackClient = require('../slackClient.js');
const Jira = require('../jiraCalls/assigneeInfo.js');

module.exports.process = (event, token, name) => {
    Jira.process(name)
        .then((response) => respond(response, event, token, name))
        .catch(error => console.log("JiraErr: " + error));
};

const respond = (jiraResponse, event, token, name) => {
    console.log("res: " + JSON.stringify(jiraResponse));

    const numOfIssues = jiraResponse['total'];

    var response = "*" + name;

    if (numOfIssues > 0){
        response += " is working on " + numOfIssues + " issue(s)*";
        for (i = 0; i < numOfIssues; i++){
            response += '\n>' + jiraResponse['issues'][i]['key'];
        }
    } else {
        response += " is not currently working on any issues*";
    }

    return SlackClient.send(event, response, token);
};
