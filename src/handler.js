const https = require('https');
const requireDir = require('require-dir');
const OAuth = require('./oauth.js');
const Templates = require('./templates.js');
const SlackClient = require('./slackClient.js');
const Luis = require('./luis.js');
const IntentHandlers = requireDir('./intentHandlers');
const Error = require('./error.js');
const AWS = require("aws-sdk");
const lambda = new AWS.Lambda({
  region: "ap-southeast-2"
});

const client = {
	id: process.env.CLIENT_ID,
	secret: process.env.CLIENT_SECRET,
	botID: process.env.SLACK_BOT_ID
};

module.exports.install = (event, context, callback) => {
	callback(null, {
		statusCode: 200,
		headers: {
			'Content-Type': 'text/html'
		},
		body: Templates.install(client.id)
	});
};

module.exports.authorized = (event, context, callback) => {
	const code = event.queryStringParameters.code;

	https.get(`https://slack.com/api/oauth.access?client_id=${client.id}&client_secret=${client.secret}&code=${code}`, response => {
		var body = '';
		response.on('data', chunk => body += chunk);
		response.on('end', () => {
			const jsonBody = JSON.parse(body);
			OAuth.storeAccessToken(jsonBody.team_id, jsonBody.bot.bot_access_token)
				.catch(error => console.log(error));
		});
	});

	callback(null, {
		statusCode: 200,
		headers: {
			'Content-Type': 'text/html'
		},
		body: Templates.authorized()
	});
};

// receptionist Lambda responds to url_verification requests
// or passes request onto event Lambda and immediately returns
// a HTTP 200 response.
module.exports.receptionist = (event, context, callback) => {
    const jsonBody = JSON.parse(event.body);
    console.log("Text: " + JSON.stringify(jsonBody.event.text));
    const response = {
          statusCode: 200
    };

    // we don't want to respond to Slack HTTP timeout retries
    var timeoutRetry = false;
    if (event.headers['X-Slack-Retry-Reason']
        && event.headers['X-Slack-Retry-Reason'] === 'http_timeout'){
        console.log("Slack timed out and sent a retry");
        timeoutRetry = true;
    }

    if (jsonBody.type === 'url_verification'){
        response.headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        response.body = jsonBody.challenge;
    // only respond to tags and ignore http_timeout retries
    } else if (jsonBody.event.text.includes(`@${client.botID}`) && !timeoutRetry){
        // asynchronously call event Lambda
        lambda.invoke({
            FunctionName: 'poet-bot-dev-event',
            InvocationType: 'Event',
            Payload: JSON.stringify(event, null, 2)
            }, function(error, data) {
            if (error) {
                console.log("Invoke error: " + error);
                context.done('error', error);
            }
            if(data.Payload){
                console.log("Invoke success: " + data.Payload);
                context.succeed(data.Payload)
            }
        });
    }

    callback(null, response);
};


module.exports.event = (event, context, callback) => {
    const jsonBody = JSON.parse(event.body);

    if (jsonBody.type === 'event_callback'){
        OAuth.retrieveAccessToken(jsonBody.team_id)
            .then(botAccessToken => handleEvent(jsonBody.event, botAccessToken))
            .catch(error => console.log(error));
	}
};


const handleEvent = (event, token) => {
	if (event.type === 'message'){
        // ignore ourselves
        if (!event.subtype || event.subtype !== 'bot_message') {
            // call Luis
            Luis.process(event.text.replace(`<@${client.botID}>`, ''))
                .then((response) => handleIntent(response, event, token))
                .catch(error => console.log("HandlerErr: " + error));
        }
	}
};

// Report error or call the JIRA handler function based on Luis response
const handleIntent = (response, event, token) => {
    console.log("LUIS: " + JSON.stringify(response));
    const intent = response.topScoringIntent.intent;
    var entity = null;
    if (response.entities.length != 0){
        entity = response.entities[0].entity;
    }

    const IntentsWithoutEntities = ["None", "Help"];

    // hand off execution to intended JIRA handler
    if (intent in IntentHandlers){
        if (entity === null && IntentsWithoutEntities.indexOf(intent) == -1){
            Error.report("Looks like Luis figured out what you want, but couldn't find an entity. Try rephrasing. If it persists, Luis needs to be trained more. Talk to the developer!", event, token);
        } else {
            IntentHandlers[intent].process(event, token, entity);
        }
    } else {
        Error.report("I understand you, but that feature hasn't been implemented yet! Go slap the developer! :raised_hand_with_fingers_splayed: ", event, token);
    }
};
