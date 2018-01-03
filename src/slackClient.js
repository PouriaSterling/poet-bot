const WebClient = require('@slack/client').WebClient;
const OAuth = require('./oauth.js');

module.exports.postMessage = (event, text, attachments, token) => {
    const web = new WebClient(token);
    web.chat.postMessage(event.channel, text, {
        attachments: JSON.stringify(attachments)
    })
        .catch(error => console.log(`Error posting Slack message: ${error}`));
};

module.exports.usersProfileGet = (userID, event, team_id) => {
    console.log(`UserID: ${userID}`);

    return OAuth.retrieveUserAccessToken(team_id)
        .then(userAccessToken => {
            return callUserProfileGet(userID, userAccessToken);
        })
        .catch(error => {
            console.log("Retrieval error: " + error);
            Error.report("User Access Token missing, please re-install/re-authorize Poet.\nErr Msg: " + error, event, token);
        });
};

const callUserProfileGet = (userID, token) => {
    const web = new WebClient(token);

    return web.users.profile.get({user: userID})
        .then(response => {
            console.log(`Conversion response: ${JSON.stringify(response)}`);
            console.log(`Converted Name: ${JSON.stringify(response.profile.display_name)}`);
            return response.profile.display_name;
        })
        .catch(error => console.log(`Error converting Slack userID: ${error}`));
};