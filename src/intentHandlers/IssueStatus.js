const SlackClient = require('../slackClient.js');
const Jira = require('../jiraCalls/issueInfo.js');
const Error = require('../error.js');
const Hyperlink = require('../hyperlink.js');


module.exports.process = (event, token, issueID) => {
    Jira.process(issueID)
        .then((response) => respond(response, event, token, issueID))
        .catch((error) => console.log("JirErr: " + error));
};

const respond = (jiraResponse, event, token, issueID) => {
    // catch JIRA call errors
    if (jiraResponse['errorMessages']){
        Error.report("JIRA error :" + jiraResponse['errorMessages'], event, token);
        return;
    }

    const status = jiraResponse['fields']['status']['name'];

    const text = `Status of ${Hyperlink.jiraLink(issueID)}`;
    const attachments = [
        {
            "title": status,
            "color": "good"
        }
    ];
    SlackClient.send(event, text, attachments, token);
};
