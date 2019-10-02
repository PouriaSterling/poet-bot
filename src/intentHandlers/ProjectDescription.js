const SlackService = require('../services/SlackService.js');
const JiraService = require('../services/JiraService.js');
const DBService = require('../services/DBService.js');
const Slackify = require('slackify-html');

module.exports.process = async (event, token) => {
    // get the project key for the channel
    const ContextResponse = await DBService.retrieveChannelContext(event.channel)
        .catch(error => {throw new Error(`Failed to fetch project key for channel context: ${error}`)});

    if (!ContextResponse || !ContextResponse.projectKey){
        throw new Error("No channel project has been set yet, set one using e.g. '@poet Set the project to POET'");
    }

    const projectKey = ContextResponse.projectKey;

    // Call JIRA to make sure projectKey is a valid JIRA project
    const jiraResponse = await JiraService.projectInfo(projectKey)
        .catch(error => {throw new Error(`Error fetching *Project Description* of project *${projectKey}*":\n${error.message}`)});

    // extract relevant JIRA data
    const name = jiraResponse['name'];
    const description = jiraResponse['description'];

    // construct the response to be sent to Slack
    const projectKeyLink = JiraService.HyperlinkJiraProjectKey(projectKey, name);
    const text = description ? `Description of ${projectKeyLink}` : `No description exists for ${projectKeyLink}`;
    const attachments = [
        {
            "text": Slackify(description),
            "color": "good",
            "mrkdwn_in": ["text"]
        }
    ];

    return SlackService.postMessage(event.channel, text, attachments, token);
};
