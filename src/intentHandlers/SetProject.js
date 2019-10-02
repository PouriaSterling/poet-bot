const SlackService = require('../services/SlackService.js');
const JiraService = require('../services/JiraService.js');
const DBService = require('../services/DBService.js');

module.exports.process = async (event, token, entities) => {
    var projectKey = null;
    // if no entity was found by Luis throw an error
    if (entities.length != 0){
        projectKey = entities[0].entity.toUpperCase();
    }else{
        throw new Error("Error *Setting Project* because Luis couldn't find a project key");
    }

    // Call JIRA to make sure projectKey is a valid JIRA project
    await JiraService.projectInfo(projectKey)
        .catch(error => {throw new Error(`Error *Setting Project*:\n${error.message}`)});

    const ContextResponse = await DBService.retrieveChannelContext(event.channel
        .catch(error => {throw new Error(`Failed to fetch project key for channel context: ${error}`)}));

    // check if a project key has already been set for the channel
    if (ContextResponse && ContextResponse.projectKey){
        text = `:exclamation: The channel project is already set to ${ContextResponse.projectKey}`;
        var attachments = [
            {
                "title": `Are you sure you want to change it to ${projectKey}?`,
                "color": "warning",
                "callback_id": "SetProject",
                "actions": [
                    {
                        "name": projectKey,
                        "text": "Yes, change it",
                        "type": "button",
                        "value": "yes",
                        "style": "danger"
                    },
                    {
                        "name": projectKey,
                        "text": "No, leave it",
                        "type": "button",
                        "value": "no"
                    }
                ]
            }
        ];
        if (ContextResponse.projectKey == projectKey){
            attachments = [{}];
        }
        SlackService.postMessage(event.channel, text, attachments, token);
    }else{
        await setProjectKey(projectKey, event.channel, token);
    }
};


module.exports.interactiveCallback = async (event, token) => {
    console.log(`SetProject interactiveCallback: ${JSON.stringify(event)}`);
    switch (event.actions[0].value){
        case 'yes':
            await setProjectKey(event.actions[0].name, event.channel.id, token, event.message_ts);
//            SlackService.updateMessage(event.channel.id, `You have chosen ${event.actions[0].value}`, [{}], token, event.message_ts);
            break;
        case 'no':
            SlackService.updateMessage(event.channel.id, `You've chosen to not update the channel project`, [{}], token, event.message_ts);
            break;
        default:
            throw new Error(`Internal error: '${event.actions[0].value}' is not a correct option for SetProject interactiveCallback`);
    }
};


const setProjectKey = async (projectKey, channel, token, timestamp) => {
    // set the project key for the channel
    console.log("Storing: " + projectKey);
    await DBService.updateChannelContext(channel, { "projectKey" : projectKey })
        .catch(error => {throw new Error(`Failed to store project key for channel context: ${error}`)});

    // construct the response to be sent to Slack
    const text = `Successfully set the JIRA project for this channel to ${projectKey}`;
    const attachments = [
        {
            "title": ':ok_hand:',
            "color": "good",
            "callback_id": "SetProject",
        }
    ];
    if (timestamp){
        SlackService.updateMessage(channel, text, attachments, token, timestamp);
    }else{
        SlackService.postMessage(channel, text, attachments, token);
    }
};