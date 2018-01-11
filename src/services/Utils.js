const Moment = require('moment');

module.exports.timeFromNow = (date) => {
    return Moment(date).fromNow();
}

module.exports.installHTML = (clientId) =>
	`<!DOCTYPE html>
	<html>
		<head>
			<title>poet-bot</title>
		</head>
		<body>
			<h1>poet-bot</h1>
			<p>Click the button to add @poet to Slack!</p>
			<a href="https://slack.com/oauth/authorize?client_id=284688040465.284688468193&scope=channels:history,bot,users.profile:read,users:read">
			    <img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" />
			</a>
		</body>
	</html>`;

module.exports.authorizedHTML = () =>
	`<!DOCTYPE html>
	<html>
		<head>
			<title>poet-bot</title>
		</head>
		<body>
			<h1>poet-bot</h1>
			<p>Thanks and enjoy!</p>
		</body>
	</html>`;
