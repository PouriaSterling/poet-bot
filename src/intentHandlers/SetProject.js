const SlackService = require('../services/SlackService.js');
const JiraService = require('../services/JiraService.js');
const DBService = require('../services/DBService.js');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

module.exports.process = async ((event, token, entities) => {
    var projectKey = null;
    // if no entity was found by Luis throw an error
    if (entities.length != 0){
        projectKey = entities[0].entity.toUpperCase();
    }else{
        throw new Error("Error *Setting Project* because Luis couldn't find an entity");
    }

    // Call JIRA to make sure projectKey is a valid JIRA project
    await (JiraService.projectInfo(projectKey)
        .catch(error => {throw new Error(`Error *Setting Project*:\n${error.message}`)}));

    // set the project key for the channel
    console.log("Storing: " + projectKey);
    await (DBService.updateChannelContext(event.channel, projectKey, "projectKey")
        .catch(error => {throw new Error(`Failed to store project key for channel context: ${error}`)}));

    // construct the response to be sent to Slack
    const text = `Successfully set the JIRA project for this channel to ${projectKey}`;
    const attachments = [
        {
            "title": ':ok_hand:',
            "color": "good"
        }
    ];
    SlackService.postMessage(event, text, attachments, token);
});
