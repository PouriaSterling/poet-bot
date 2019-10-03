const Moment = require("moment");

// return how long ago the argument 'date' is from now in
// 'friendly time' (e.g. a few seconds ago, 2 days ago)
module.exports.timeFromNow = date => {
  return Moment(date).fromNow();
};

module.exports.todaysDate = () => {
  return Moment().format("YYYY/MM/DD");
};

// HTTP template with embedded Slack install link for this bot
module.exports.installHTML = clientId =>
  `<!DOCTYPE html>
	<html>
		<head>
			<title>poet-bot</title>
		</head>
		<body>
			<h1>poet-bot</h1>
			<p>Click the button to add @poet to Slack!</p>
			<a href="https://slack.com/oauth/authorize?client_id=${clientId}&scope=channels:history,bot,users.profile:read,users:read">
			    <img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" />
			</a>
		</body>
	</html>`;

// HTTP template for routing to after successful installation
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

// A list of Custom Jenkin's emojis expected to be found in Slack
// TODO Add these emojis to the repo
const JenkinsEmojis = [
  ":bee-jenkins:",
  ":power-jenkins:",
  ":magic-jenkins:",
  ":detective-jenkins:",
  ":magnanimous-jenkins:",
  ":jenkinstein:",
  ":peru-jenkins:",
  ":king-jenkins:",
  ":cloud-jenkins:",
  ":santa-jenkins:",
  ":paris-jenkins:",
  ":ninja-jenkins:",
  ":miner-jenkins:",
  ":mario-jenkins:",
  ":alien-jenkins:",
  ":actor-jenkins:",
  ":cowboy-jenkins:",
  ":musket-jenkins:",
  ":admiral-jenkins:",
  ":baturro-jenkins:",
  ":belarus-jenkins:",
  ":general-jenkins:",
  ":kung-fu-jenkins:",
  ":mechanic-jenkins:",
  ":accordion-jenkins:",
  ":formal-jenkins:",
  ":space-jenkins:",
  ":world-jenkins:",
  ":fire-jenkins:",
  ":capt-jenkins:",
  ":pest-control-jenkins:",
  ":hand-drawn-jenkins:",
  ":ice-cream-jenkins:",
  ":barcelona-jenkins:",
  ":ron-burgendy-jenkins:"
];

/** Return a random Jenkins emoji */
module.exports.randomJenkins = () =>
  JenkinsEmojis[Math.floor(Math.random() * JenkinsEmojis.length)];
