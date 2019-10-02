const JenkinsService = require("../services/JenkinsService.js");
const SlackService = require("../services/SlackService.js");

module.exports.process = async (event, token) => {
  const result = await JenkinsService.check().catch(error => {
    console.log("got an error", error);
  });

  const attachments = [
    {
      text: ":capt-jenkins: Job is now - " + result,
      mrkdwn_in: ["text"],
      color: "#32c8c8"
    }
  ];

  SlackService.postMessage(
    event.channel,
    "job is now " + result,
    attachments,
    token
  );
};
