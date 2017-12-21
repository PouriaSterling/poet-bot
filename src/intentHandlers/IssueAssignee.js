const SlackClient = require('../slackClient.js');
const Jira = require('../jiraCalls/issueInfo.js');
const Error = require('../error.js');

module.exports.process = (event, token, issueID) => {
    Jira.process(issueID)
        .then((response) => respond(response, event, token, issueID))
        .catch(error => console.log("JiraErr: " + error));
};

const respond = (jiraResponse, event, token, issueID) => {
    // catch JIRA call errors
    if (jiraResponse['errorMessages']){
        Error.report("JIRA error: " + jiraResponse['errorMessages'], event, token);
        return;
    }

    const assignee = jiraResponse['fields']['assignee']['displayName'];

    const text = `Assignee of ${issueID.toUpperCase()}`;
    const attachments = [
        {
            "title": assignee,
            "color": "good"
        }
    ];
    SlackClient.send(event, text, attachments, token);
};

