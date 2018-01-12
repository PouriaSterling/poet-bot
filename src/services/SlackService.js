const WebClient = require('@slack/client').WebClient;
const toTitleCase = require('titlecase');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

module.exports.postMessage = (event, text, attachments, token) => {
    const web = new WebClient(token);
    web.chat.postMessage(event.channel, text, {
        attachments: JSON.stringify(attachments)
    })
        .catch(error => console.log(`Error posting Slack message: ${error}`));
};

module.exports.postError = (errorMessage, event, token) => {
    module.exports.postMessage(event, "Whoops :cry:",
        [
            {
                "text": errorMessage,
                "color": "danger",
                "mrkdwn_in": ["text"]
            }
        ],
        token);
};

module.exports.GetFullName = async ((target, entityType, token) => {
    const web = new WebClient(token);
    const userList = await (web.users.list()
        .catch(err=> console.log(`Error getting user list: ${err}`)));

    console.log(`User List: ${JSON.stringify(userList)}`);

    var fullName = null;
    var jiraUsername = null;

    switch(entityType){
        case 'Self':
        case 'Mention':
            for (i = 0; i < userList.members.length; i++){
                if (userList.members[i].id == target){
                    fullName = JSON.stringify(userList.members[i].real_name);
                    jiraUsername = JSON.stringify(userList.members[i].name);
                    break;
                }
            }
            break;
        case 'JiraUsername':
            for (i = 0; i < userList.members.length; i++){
                if (userList.members[i].name == target){
                    fullName = JSON.stringify(userList.members[i].real_name);
                    break;
                }
            }
            jiraUsername = target;
            break;
        case 'FullName':
            for (i = 0; i < userList.members.length; i++){
                if (userList.members[i].name == target){
                    jiraUsername = JSON.stringify(userList.members[i].name);
                    break;
                }
            }
            fullName = JSON.stringify(toTitleCase(target));
            break;
    }

    console.log("Found fullname: " + fullName + ", jirausername: " + jiraUsername);
    return {"fullName": fullName, "jiraUsername": jiraUsername};
});
