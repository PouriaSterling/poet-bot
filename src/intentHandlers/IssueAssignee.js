const SlackClient = require('../helpers/slackClient.js');
const Jira = require('../jiraCalls/issueInfo.js');
const Error = require('../helpers/error.js');
const Hyperlink = require('../helpers/hyperlink.js');

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

    const text = `Assignee of ${Hyperlink.jiraLink(issueID)}`;
    const attachments = [
        {
            "title": assignee,
            "color": "good"
        }
    ];
    SlackClient.postMessage(event, text, attachments, token);
};

