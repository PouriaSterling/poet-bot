const JenkinsService = require("../services/JenkinsService.js");
const SlackService = require("../services/SlackService.js");
const Utils = require("../services/Utils.js");

module.exports.process = async (event, token) => {
  const isUnlocked = await JenkinsService.isUnlocked().catch(error => {
    throw new Error(
      "Error retrieving the state of the Jenkins deploy job:\n" + error
    );
  });

  const text = `Deployment is currently *${isUnlocked ? "UN" : ""}LOCKED*!`;

  const attachments = [
    {
      text: `${
        isUnlocked ? ":dove_of_peace:" : ":lock:"
      } ${Utils.randomJenkins()} ${isUnlocked ? ":leaves:" : ":lock:"}`,
      mrkdwn_in: ["text"],
      color: isUnlocked ? "good" : "danger"
    }
  ];

  return SlackService.postMessage(event.channel, text, attachments, token);
};
