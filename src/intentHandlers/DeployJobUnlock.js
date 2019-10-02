const JenkinsService = require("../services/JenkinsService.js");
const SlackService = require("../services/SlackService.js");

module.exports.process = async (event, token) => {
  await JenkinsService.unlock().catch(error => {
    console.log("got an error", error);
  });

  const result = await JenkinsService.check().catch(error => {
    console.log("got an error", error);
  });

  const release_developers =
    "https://media.giphy.com/media/FPcnQhOCCLCGk/giphy.gif";

  const text = result + release_developers;

  const attachments = [
    {
      text:
        ":capt-jenkins: The deploy job is now - " +
        result +
        "\n" +
        release_developers,
      mrkdwn_in: ["text"],
      color: "#32c8c8",
      image_url: release_developers
    }
  ];

  SlackService.postMessage(event.channel, text, attachments, token);
};
