const WebClient = require('@slack/client').WebClient;
const OAuth = require('./oauth.js');
const toTitleCase = require('titlecase');

module.exports.postMessage = (event, text, attachments, token) => {
    const web = new WebClient(token);
    web.chat.postMessage(event.channel, text, {
        attachments: JSON.stringify(attachments)
    })
        .catch(error => console.log(`Error posting Slack message: ${error}`));
};

//module.exports.usersProfileGet = (userID, event, team_id) => {
//    console.log(`UserID: ${userID}`);
//
//    return OAuth.retrieveUserAccessToken(team_id)
//        .then(userAccessToken => {
//            return callUserProfileGet(userID, userAccessToken);
//        })
//        .catch(error => {
//            console.log("Retrieval error: " + error);
//            Error.report("User Access Token missing, please re-install/re-authorize Poet.\nErr Msg: " + error, event, token);
//        });
//};

//const callUserProfileGet = (userID, token) => {
//    const web = new WebClient(token);
//
//    return web.users.profile.get({user: userID})
//        .then(response => {
//            console.log(`Conversion response: ${JSON.stringify(response)}`);
//            console.log(`Converted Name: ${JSON.stringify(response.profile.display_name)}`);
//            return response.profile.display_name;
//        })
//        .catch(error => console.log(`Error converting Slack userID: ${error}`));
//};

module.exports.GetFullName = (target, entityType, token) => {
    const web = new WebClient(token);
    return web.users.list()
        .then(list => {
            console.log(`User List: ${JSON.stringify(list)}`);
            return findUser(list, target, entityType);
        })
        .catch(err=> console.log(`Error getting user list: ${err}`));
};

const findUser = (list, target, entityType) => {
    console.log("Length: " + list.members.length);
    var fullName = null;
    switch(entityType){
        case 'Self':
        case 'Mention':
            console.log(`Searching for ${target} in Mention`);
            for (i = 0; i < list.members.length; i++){
                if (list.members[i].id == target){
                    fullName = JSON.stringify(list.members[i].real_name);
                    break;
                }
            }
            break;
        case 'JiraUsername':
            console.log(`Searching for ${target} in JiraUsername`);
            for (i = 0; i < list.members.length; i++){
                if (list.members[i].name == target){
                    fullName = JSON.stringify(list.members[i].real_name);
                    break;
                }
            }
            if (!fullName){
                fullName = target;
            }
            break;
        case 'FullName':
            fullName = JSON.stringify(toTitleCase(target));
    }

    // didn't find the name in the Slack user list
    if (!fullName){
        fullName = 'NameNotFound';
    }
    console.log("Found: " + fullName)
    return fullName;
}