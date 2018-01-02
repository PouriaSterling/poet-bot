const WebClient = require('@slack/client').WebClient;
const OAuth = require('../oauth.js');
//import { WebClient } from '@slack/client';

module.exports.postMessage = (event, text, attachments, token) => {
    const web = new WebClient(token);
    web.chat.postMessage(event.channel, text, {
        attachments: JSON.stringify(attachments)
    })
        .catch(error => console.log(`Error posting Slack message: ${error}`));
};

module.exports.usersProfileGet = (userID) => {
    console.log(`UserID: ${userID}`);

    OAuth.retrieveUserAccessToken(jsonBody.team_id)
        .then(botAccessToken => handleEvent(jsonBody.event, botAccessToken))
        .catch(error => console.log(error));

    const web = new WebClient("xoxp-284688040465-286072921574-285247495572-690e01350d9e1bb253d0bce4752003f3");

//    web._makeAPICall('users.profile.get', null /*no required args to this call*/, {
//        user: userID, //optional user param
//        include_labels: false //optional include_labels param, defaults to false
//    }, function(err, info){
//        if (!err) {
//            console.log(`Conversion response: ${JSON.stringify(info)}`);
//            console.log(`Converted Name: ${JSON.stringify(info.profile.display_name)}`);
//            return info.profile.display_name;
//        }else{
//            var body = JSON.parse(err);
//            console.log(`Error converting userID. Needed: ${JSON.stringify(body.needed)}, Got: ${JSON.stringify(body.provided)}`);
//        }
//    });

    return web.users.profile.get({user: userID})
        .then(response => {
            console.log(`Conversion response: ${JSON.stringify(response)}`);
            console.log(`Converted Name: ${JSON.stringify(response.profile.display_name)}`);
            return response.profile.display_name;
        })
        .catch(error => console.log(`Error converting Slack userID: ${error}`));
}