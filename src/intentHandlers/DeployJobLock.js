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
      text: `:lock: ${Utils.randomJenkins()} :lock:`,
      mrkdwn_in: ["text"],
      color: "danger"
    }
  ];

  if (!isUnlockedBefore) {
    return SlackService.postMessage(
      event.channel,
      "Deployment is already *LOCKED*!",
      attachments,
      token
    );
  }

  await JenkinsService.lock().catch(error => {
    throw new Error("Error locking deployment:\n" + error);
  });

  return SlackService.postMessage(
    event.channel,
    "Deployment is now *LOCKED*!",
    attachments,
    token
  );
};
