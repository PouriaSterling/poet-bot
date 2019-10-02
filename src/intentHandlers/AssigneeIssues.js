const SlackService = require('../services/SlackService.js');
const JiraService = require('../services/JiraService.js');
const Utils = require('../services/Utils');

const callJira = (jql) => {
    return JiraResponse = JiraService.assigneeInfo(jql)
        .then(result => {return result;})
        .catch(error => {return "Error";});
}

module.exports.process = async (event, token, entities) => {
    var entity = null;
    var entityType = null;
    // check that an entity was found by Luis or call an error
    if (entities.length != 0){
        entityType = entities[0].type;
        if (entityType == "Self"){
            entity = event.user;
        }else if (entityType == "Mention"){
            entity = entities[0].entity.toUpperCase();
        }else{
            entity = entities[0].entity;
        }
    }else{
        throw new Error("Error fetching *Assignee Issues* because Luis couldn't figure out who you want to know about");
    }

    // Get more information about the user via from Slack
    SlackResponse = await SlackService.GetFullName(entity, entityType, token)
        .catch(error => {throw new Error(`Error in *Assignee Issues* while trying to convert ${entity}\n${error}`)});

    // throw an error if no valid name could be found
    if (SlackResponse['fullName'] == null && SlackResponse['jiraUsername'] == null ){
        throw new Error("Error fetching *Assignee Issues*. The user you specified doesn't have enough name information present in Slack");
    }

    // Try to find user info on JIRA using jiraUsername first and then using fullName
    var JiraResponse = null;
    if (SlackResponse['jiraUsername']){
        JiraResponse = await callJira("assignee=" + SlackResponse['jiraUsername'] + " and status='in progress' ORDER BY updated DESC");
    }
    if( (!JiraResponse || JiraResponse['warningMessages']) && SlackResponse['fullName']){
        JiraResponse = await callJira("assignee=" + SlackResponse['fullName'] + " and status='in progress' ORDER BY updated DESC");
    }
    if (!JiraResponse || JiraResponse['warningMessages']){
        throw new Error(`Error fetching *Assignee Issues* because neither '${SlackResponse['jiraUsername']}' nor ${SlackResponse['fullName']} exist in JIRA`);
    }

    console.log("res: " + JSON.stringify(JiraResponse));

    const numOfIssues = JiraResponse['total'];

    if (SlackResponse['fullName']){
        var text = SlackResponse['fullName'].replace(/"/g, '');
    }else{
        var text = SlackResponse['jiraUsername'].replace(/"/g, '');
    }
    var attachments = [];

    if (numOfIssues > 0){
        text += ` is working on ${numOfIssues} issue(s)`;
        for (i = 0; i < numOfIssues; i++){
            var formattedDate = Utils.timeFromNow(JiraResponse['issues'][i]["fields"]['updated']);
            var title = `*${JiraService.HyperlinkJiraIssueID(JiraResponse['issues'][i]['key'])}* - *${JiraResponse['issues'][i]['fields']['summary']}*`;
            attachments[i] = {
                "fields": [
                    {
                        "value": title,
                        "short": true
                    },
                    {
                        "value": `Updated ${formattedDate}`,
                        "short": true
                    }
                ],
                "color": "good",
                "mrkdwn_in": ["fields"]
            }
        }
    } else {
        text += " is not currently working on any issues";
    }

    return SlackService.postMessage(event.channel, text, attachments, token);
};
