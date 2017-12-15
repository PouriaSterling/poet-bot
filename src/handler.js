const https = require('https');
const requireDir = require('require-dir');

const AWS = require("aws-sdk");
const lambda = new AWS.Lambda({
  region: "ap-southeast-2"
});

const OAuth = require('./oauth.js');
const Templates = require('./templates.js');
const SlackClient = require('./slackClient.js');
const Luis = require('./luis.js');

const jiraCalls = requireDir('./jiraCalls');

const client = {
	id: process.env.CLIENT_ID,
	secret: process.env.CLIENT_SECRET
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

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports.event = (event, context, callback) => {
	const jsonBody = JSON.parse(event.body);
//	const jsonHeaders = JSON.parse(event);
    console.log("Text: " + jsonBody.event.text);
    console.log(event);
    // X-Slack-Retry-Reason

//    sleep(3000);
	const response_success = {
          statusCode: 200,
          body: JSON.stringify({
            message: 'ok'
          }),
    };
    callback(null, response_success);


	switch (jsonBody.type) {
		case 'url_verification':
			response.headers = {
				'Content-Type': 'application/x-www-form-urlencoded'
			};
			response.body = jsonBody.challenge;
			break;

		case 'event_callback':
			OAuth.retrieveAccessToken(jsonBody.team_id)
				.then(botAccessToken => handleEvent(jsonBody.event, botAccessToken))
				.catch(error => console.log(error));
//            handleEvent(jsonBody.event, "1234");
			break;
	}
};

const handleEvent = (event, token) => {
	console.log("Handler");
	switch (event.type) {
		case 'message':
			// ignore ourselves
			if (!event.subtype || event.subtype !== 'bot_message') {
                SlackClient.send(event, ">" + event.text, token);

//                lambda.invoke({
//                    FunctionName: 'name_of_your_lambda_function',
//                    Payload: JSON.stringify(event, null, 2) // pass params
//                    }, function(error, data) {
//                        if (error) {
//                            context.done('error', error);
//                        }
//                        if(data.Payload){
//                            context.succeed(data.Payload)
//                        }
//                    });

				// call Luis
//                Luis.process(event.text)
//                    .then((intent) => handleIntent(intent, event, token))
//                    .catch(error => console.log("HandErr: " + error));

//                const sample = {
//                                 "query": "hello?",
//                                 "topScoringIntent": {
//                                   "intent": "None",
//                                   "score": 0.271888375
//                                 },
//                                 "entities": []
//                               };
//                handleIntent(sample, event, token);
			}
			break;
	}
	console.log("/Handler");
};


const handleIntent = (response, event, token) => {
    console.log(JSON.stringify(response));

    var intent = response.topScoringIntent.intent;
    var entity = "err";

    // check that an entity was found by Luis
    if (response.entities.length == 0){
        console.log("Error: entity not found");
        intent = 'NotDefined';
    } else {
        entity = response.entities[0].entity;
    }

    // hand off execution to intended JIRA handler
    if (intent in jiraCalls){
        jiraCalls[intent].process(event, token, entity);
    }else{
        SlackClient.send(event, "Error: Feature not implemented yet.", token);
    }
};

module.exports.receptionist = (event, context, callback) => {
    console.log("~~~Working!!");
}