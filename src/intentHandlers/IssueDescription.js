const ContextService = require('../services/ContextService.js');
const SlackService = require('../services/SlackService.js');
const JiraService = require('../services/JiraService.js');
const j2s = require('jira2slack');

module.exports.process = async (event, token, entities) => {
    var issueID = null;
    // if no entity was found by Luis, check for a context issue
    if (entities.length != 0){
        issueID = entities[0].entity;
    }else{
        issueID = await ContextService.fetchContextIssue(event.channel, token)
            .catch(error => {throw new Error("Error fetching context issue for *Issue Description*:\n" + error.message)});
        if (issueID === "none" || issueID === "tooOld"){
            throw new Error("Error fetching *Issue Description* because Luis couldn't find an entity and no issue has been recently discussed");
        }
    }
    issueID = issueID.replace(/ /g, '').toUpperCase();

    // Call JIRA to get information for the issueID
    const jiraResponse = await JiraService.issueInfo(issueID)
        .catch(error => {throw new Error(`Error fetching *Description* of *${issueID}* from JIRA:\n${error.message}`)});

    // Extract relevant information from the JIRA response
    const summary = jiraResponse['fields']['summary'];
    const status = jiraResponse['fields']['status']['name'];
    const assignee = jiraResponse['fields']['assignee']['displayName'];
    var desc = jiraResponse['fields']['description'];
    if (!desc){
        desc = 'This ticket has no description.'
    }

    // construct the response to be sent to Slack
    const text = `Description of ${JiraService.HyperlinkJiraIssueID(issueID)}`;
    const attachments = [
        {
            "title": summary,
            "fields": [
                {
                    "title": "Status",
                    "value": status,
                    "short": true
                },
                {
                    "title": "Assignee",
                    "value": assignee,
                    "short": true
                }
            ],
            "color": "good",
            "mrkdwn_in": ["fields"]
        },
        {
            "title": "Description",
            "text": j2s.toSlack(desc),
            "color": "good",
            "mrkdwn_in": ["text"]
        },
    ];
    return SlackService.postMessage(event.channel, text, attachments, token);
};