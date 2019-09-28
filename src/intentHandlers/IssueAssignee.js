const ContextService = require('../services/ContextService.js');
const SlackService = require('../services/SlackService.js');
const JiraService = require('../services/JiraService.js');

module.exports.process = async (event, token, entities) => {
    var issueID = null;
    // if no entity was found by Luis, check for a context issue
    if (entities.length != 0){
        issueID = entities[0].entity;
    }else{
        issueID = await (ContextService.fetchContextIssue(event.channel, token)
            .catch(error => {throw new Error("Error fetching context issue for *Issue Assignee*:\n" + error.message)}));
        if (issueID === "none" || issueID === "tooOld"){
            throw new Error("Error fetching *Issue Assignee* because Luis couldn't find an entity and no issue has been recently discussed");
        }
    }
    issueID = issueID.replace(/ /g, '').toUpperCase();

    // Call JIRA to get information for the issueID
    const jiraResponse = await (JiraService.issueInfo(issueID)
        .catch(error => {throw new Error(`Error fetching *Issue Assignee* of *${issueID}* from JIRA:\n${error.message}`)}));

    const assignee = jiraResponse['fields']['assignee']['displayName'];

    // construct the response to be sent to Slack
    const text = `Assignee of ${JiraService.HyperlinkJiraIssueID(issueID)}`;
    const attachments = [
        {
            "title": assignee,
            "color": "good"
        }
    ];
    SlackService.postMessage(event.channel, text, attachments, token);
};
