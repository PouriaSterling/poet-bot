const ContextService = require('../services/ContextService.js');
const SlackService = require('../services/SlackService.js');
const JiraService = require('../services/JiraService.js');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

module.exports.process = async ((event, token, entities) => {
    var issueID = null;
    // if no entity was found by Luis, check for a context issue
    if (entities.length != 0){
        issueID = entities[0].entity;
    }else{
        issueID = await (ContextService.fetchContextIssue(event, token)
            .catch(error => {throw new Error("Error fetching context issue for *Issue Status*:\n" + error.message)}));
        if (issueID === "none" || issueID === "tooOld"){
            throw new Error("Error fetching *Issue Status* because Luis couldn't find an entity and no issue has been recently discussed");
        }
    }
    issueID = issueID.replace(/ /g, '').toUpperCase();

    // Call JIRA to get information for the issueID
    const jiraResponse = await (JiraService.issueInfo(issueID)
        .catch(error => {throw new Error(`Error fetching *Issue Status* of *${issueID}* from JIRA:\n${error.message}`)}));

    const status = jiraResponse['fields']['status']['name'];

    // construct the response to be sent to Slack
    const text = `Status of ${JiraService.HyperlinkJiraIssueID(issueID)}`;
    const attachments = [
        {
            "title": status,
            "color": "good"
        }
    ];
    SlackService.postMessage(event, text, attachments, token);
});
