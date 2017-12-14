const https = require('https');
const OAuth = require('./oauth.js');
const Templates = require('./templates.js');
const SlackClient = require('./slackClient.js');
const Luis = require('./luis.js');
const IssueDescription = require('./jiraCalls/IssueDescription.js');
const IssueAssignee = require('./jiraCalls/IssueAssignee.js');
const IssueStatus = require('./jiraCalls/IssueStatus.js');
const AssigneeIssues = require('./jiraCalls/AssigneeIssues.js');
const IssuesForStatus = require('./jiraCalls/IssuesForStatus.js');

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

module.exports.event = (event, context, callback) => {
//    console.log("type: " + event.body);
	const jsonBody = JSON.parse(event.body);
	const response = {
		statusCode: 200
	};

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

	callback(null, response);
};

const handleEvent = (event, token) => {
	console.log("Handler");

	switch (event.type) {
		case 'message':
			// ignore ourselves
			if (!(event.subtype && event.subtype === 'bot_message')) {
				// call Luis
                Luis.process(event.text)
                    .then((intent) => handleIntent(intent, event, token))
                    .catch(error => console.log("HandErr: " + error));
//                SlackClient.send(event, "Nothing!!!", token);
			}
			break;
	}
	console.log("/Handler");
};


const handleIntent = (response, event, token) => {
    console.log(JSON.stringify(response));

    var intent = response.topScoringIntent.intent;
    var entity = "err";

//    console.log("Intent: " + intent);
//    console.log("length: " + response.entities.length);
    // check that an entity was found by Luis
    if (response.entities.length == 0){
        console.log("Error: entity not found");
        intent = 'None';
    } else {
        entity = response.entities[0].entity;
    }

    switch (intent) {
        case 'IssueDescription':
            console.log("switch issueDesc");
            IssueDescription.process(event, token, entity);
            break;
        case 'IssueAssignee':
            IssueAssignee.process(event, token, entity);
            break;
        case 'IssueStatus':
            IssueStatus.process(event, token, entity);
            break;
        case 'AssigneeIssues':
            AssigneeIssues.process(event, token, entity);
            break;
        case 'IssuesForStatus':
            IssuesForStatus.process(event, token, entity);
            break;
        case 'None':
            SlackClient.send(event, "Error: Your intention could not be found.", token);
            break;
        default:
            SlackClient.send(event, "Error: Feature not implemented yet.", token);
            break;
    }

//    SlackClient.send(event, "Nothing!!!", token);
};