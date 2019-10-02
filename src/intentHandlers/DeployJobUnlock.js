const JenkinsService = require("../services/JenkinsService.js");
const SlackService = require("../services/SlackService.js");
const Utils = require("../services/Utils.js");

module.exports.process = async (event, token) => {
  const isUnlockedBefore = await JenkinsService.isUnlocked().catch(error => {
    throw new Error(
      "Error retrieving the state of the Jenkins deploy job:\n" + error
    );
  });

  const attachments = [
    {
      text: `:dove_of_peace: ${Utils.randomJenkins()} :leaves:`,
      mrkdwn_in: ["text"],
      color: "good"
    }
  ];

  if (isUnlockedBefore) {
    return SlackService.postMessage(
      event.channel,
      "Deployment is already *UNLOCKED*!",
      attachments,
      token
    );
  }

  await JenkinsService.unlock().catch(error => {
    throw new Error("Error unlocking deployment:\n" + error);
  });

  return SlackService.postMessage(
    event.channel,
    "Deployment is now *UNLOCKED*!",
    attachments,
    token
  );
};
