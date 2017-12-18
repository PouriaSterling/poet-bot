const WebClient = require('@slack/client').WebClient;
//import { WebClient } from '@slack/client';

module.exports.send = (event, response, token) => {
    const web = new WebClient(token);
    web.chat.postMessage(event.channel, response)
        .catch(error => console.log(`Error posting Slack message: ${error}`));
};