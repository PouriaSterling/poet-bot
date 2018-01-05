const https = require('https');
const requireDir = require('require-dir');
const DBCalls = require('./helpers/dbCalls.js');
const Templates = require('./templates.js');
const SlackClient = require('./slackClient.js');
const Luis = require('./helpers/luis.js');
const IntentHandlers = requireDir('./intentHandlers');
const Error = require('./helpers/error.js');
const MaintainContext = require('./helpers/maintainContext.js');
const ContextFetcher = require('./helpers/contextFetcher.js');
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
		    console.log(`Auth: ${body}`);
			DBCalls.storeAccessToken(jsonBody.team_id, jsonBody.bot.bot_access_token, jsonBody.access_token)
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
    if (jsonBody.type !== 'url_verification'){
        console.log("Text: " + JSON.stringify(jsonBody.event.text));
        console.log("Event: " + JSON.stringify(jsonBody.event));
        console.log("All: " + JSON.stringify(jsonBody));
    }
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
    } else {
        // ignore bot messages
        if (!jsonBody.event.subtype || jsonBody.event.subtype !== 'bot_message'){
            MaintainContext.process(jsonBody.event.text, jsonBody.event.channel);
        }
    }

    callback(null, response);
};

module.exports.event = (event, context, callback) => {
    const jsonBody = JSON.parse(event.body);

    if (jsonBody.type === 'event_callback'){
        DBCalls.retrieveAccessToken(jsonBody.team_id)
            .then(botAccessToken => handleEvent(event, botAccessToken))
            .catch(error => console.log(error));
	}
};


const handleEvent = (event, token) => {
    const jsonBody = JSON.parse(event.body);
	if (jsonBody.event.type === 'message'){
        // ignore ourselves
        if (!jsonBody.event.subtype || jsonBody.event.subtype !== 'bot_message') {
            // call Luis
            Luis.process(jsonBody.event.text.replace(`<@${client.botID}>`, ''))
                .then((response) => handleIntent(response, jsonBody.event, token, jsonBody.team_id))
                .catch(error => {
                    console.log("LuisCatchErr: " + error);
                });
        }
	}
};

// Report error or call the JIRA handler function based on Luis response
const handleIntent = (response, event, token, team_id) => {
    console.log("LUIS: " + JSON.stringify(response));
    // catch LUIS call errors
    if (response.statusCode >= 300){
        Error.report(`Luis Error: ${response.statusCode} - ${response.message}`, event, token);
        return;
    }

    const intent = response.topScoringIntent.intent;
    var entity = null;
    var entityType = null;
    if (response.entities.length != 0){
        entity = response.entities[0].entity;
        entityType = response.entities[0].type;
    }

    const ValidIntentsWithNoEntities = ["None", "Help", "Greeting", "IssueAssignee", "IssueDescription", "IssueStatus"];

    // hand off execution to intended JIRA handler and handle missing entity errors
    if (intent in IntentHandlers){
        if (entity === null && ValidIntentsWithNoEntities.indexOf(intent) == -1){
            Error.report("Looks like Luis figured out what you intended, but couldn't find an entity. Try rephrasing. If it persists, Luis needs to be trained more. Talk to the developer!", event, token);
        }else{
            if (entity === null){
                ContextFetcher.fetch(event.channel)
                    .then(response => {
                        if (entity !== "error"){
                            intentCaller(event, token, intent, response);
                        }
                    })
                    .catch(error => console.log("Failed to fetch context: " + error));

            }else{
                IntentHandlers[intent].process(event, token, entity, entityType, team_id);
            }
        }
    }else{
        Error.report("I understand you, but that feature hasn't been implemented yet! Go slap the developer! :raised_hand_with_fingers_splayed: ", event, token);
    }
};

const intentCaller = (event, token, intent, entity) => {
    console.log("Entity: " + entity);
    IntentHandlers[intent].process(event, token, entity);
};