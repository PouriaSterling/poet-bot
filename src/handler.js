const ContextService = require('./services/ContextService.js');
const SlackService = require('./services/SlackService.js');
const LuisService = require('./services/LuisService.js');
const DBService = require('./services/DBService.js');
const Utils = require('./services/Utils.js');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const requireDir = require('require-dir');
const IntentHandlers = requireDir('./intentHandlers');
const thrw = require('throw');
const https = require('https');
const AWS = require("aws-sdk");
const lambda = new AWS.Lambda({
  region: "ap-southeast-2",
  maxRetries: 0
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
		body: Utils.installHTML(client.id)
	});
};

module.exports.authorized = (event, context, callback) => {
	const code = event.queryStringParameters.code;

	https.get(`https://slack.com/api/oauth.access?client_id=${client.id}&client_secret=${client.secret}&code=${code}`, response => {
		var body = '';
		response.on('data', chunk => body += chunk);
		response.on('end', () => {
			const jsonBody = JSON.parse(body);
			DBService.storeAccessToken(jsonBody.team_id, jsonBody.bot.bot_access_token, jsonBody.access_token)
				.catch(error => console.log(error));
		});
	});

	callback(null, {
		statusCode: 200,
		headers: {
			'Content-Type': 'text/html'
		},
		body: Utils.authorizedHTML()
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
//                context.done('error', error);
            }
            if(data.Payload){
                console.log("Invoke success: " + data.Payload);
//                context.succeed(data.Payload)
            }
        });
    } else if (!timeoutRetry) {
        // ignore bot messages
        if (!jsonBody.event.subtype || jsonBody.event.subtype !== 'bot_message'){
            ContextService.maintainContext(jsonBody.event.text, jsonBody.event.channel);
        }
    }

    const response = {
        statusCode: 200
    };
    callback(null, response);
};

module.exports.event = async ((event, context, callback) => {
    const jsonBody = JSON.parse(event.body);

    if (jsonBody.type === 'event_callback'){
        const botAccessToken = await (DBService.retrieveAccessToken(jsonBody.team_id)
            .catch(error => console.log(error)));

    	if (jsonBody.event.type === 'message'){
            // ignore ourselves
            if (!jsonBody.event.subtype || jsonBody.event.subtype !== 'bot_message') {
                // call Luis
                const response = await (LuisService.interpretQuery(jsonBody.event.text.replace(`<@${client.botID}>`, ''))
                    .catch(error => {
                        console.log("LuisCatchErr: " + error);
                    }));

                handleIntent(response, jsonBody.event, botAccessToken);
//                {
//                   "query": "description of poet-60",
//                   "topScoringIntent": {
//                     "intent": "IssueDescription",
//                     "score": 0.993386567
//                   },
//                   "entities": [
//                       {
//                         "entity": "poet - 3",
//                         "type": "IssueID",
//                         "startIndex": 15,
//                         "endIndex": 21,
//                         "score": 0.984502852
//                       }
//                   ]
//                 }
            }
    	}
	}
});

// Report error or call the JIRA handler function based on Luis response
const handleIntent = async ((response, event, token) => {
    console.log("LUIS: " + JSON.stringify(response));
    // catch LUIS call errors
    if (response.statusCode >= 300){
        SlackService.postError(`Luis Error: ${response.statusCode} - ${response.message}`, event, token);
        return;
    }

    const intent = response.topScoringIntent.intent;
//    var entity = null;
//    var entityType = null;
//    if (response.entities.length != 0){
//        entity = response.entities[0].entity;
//        entityType = response.entities[0].type;
//    }

//    const ValidIntentsWithNoEntities = ["None", "Help", "Greeting", "IssueAssignee", "IssueDescription", "IssueStatus"];
    const IntentsWithOptionalContextEntities = ["IssueAssignee", "IssueDescription", "IssueStatus"];
    const IntentsWithoutEntities = ["None", "Help", "Greeting"];

    // hand off execution to intended JIRA handler and handle missing entity errors
    if (intent in IntentHandlers){

//        if (entity || IntentsWithoutEntities.indexOf(intent) != -1){
            try{
                await (IntentHandlers[intent].process(event, token, response.entities));
            }catch(error){
                SlackService.postError(error.message, event, token);
            }
//        }else{
//            if (IntentsWithOptionalContextEntities.indexOf(intent) != -1){
//                ContextService.fetch(event, token)
//                    .then(response => {
//                        if (entity !== "error"){
//                            IntentHandlers[intent].process(event, token, response);
//                        }
//                    })
//                    .catch(error => console.log("Failed to fetch context: " + error));
//            }else{
//                SlackService.postError("Looks like Luis figured out what you intended, but couldn't find an entity. Try rephrasing. If it persists, Luis needs to be trained more. Talk to the developer!", event, token);
//            }
//        }
    }else{
        SlackService.postError("I understand you, but that feature hasn't been implemented yet! Go slap the developer! :raised_hand_with_fingers_splayed: ", event, token);
    }
});