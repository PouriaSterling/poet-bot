const SlackService = require("../services/SlackService.js");
const JiraService = require("../services/JiraService.js");
const Utils = require("../services/Utils.js");

module.exports.process = async (event, token, entities) => {
  // check that a status entity was correctly identified by Luis, or thrown and error
  var status = null;
  if (entities.length != 0) {
    status = entities[0].entity;
  } else {
    throw new Error(
      "Error searching for *Issues by Status* because Luis couldn't figure out the status you meant"
    );
  }

  // search JIRA for issues with the specified status
  const jql = "status='" + status + "' ORDER BY updated DESC";
  const jiraResponse = await JiraService.assigneeInfo(jql).catch(error => {
    throw new Error(
      `Error fetching *Issues for Status* of *${status}* from JIRA:\n${error.message}`
    );
  });

  const numOfIssues = jiraResponse["total"];
  const limitResponsesTo = 10;

  // construct the response to Slack
  var text = "There are ";
  var attachments = [];
  if (numOfIssues > 0) {
    text += `${numOfIssues} issues with the status *${status.toUpperCase()}*`;
    if (numOfIssues > limitResponsesTo) {
      text +=
        ". Showing " + limitResponsesTo + " most recently updated results.";
    }
    for (i = 0; i < Math.min(numOfIssues, limitResponsesTo); i++) {
      var formattedDate = Utils.timeFromNow(
        jiraResponse["issues"][i]["fields"]["updated"]
      );
      var title = `*${JiraService.HyperlinkJiraIssueID(
        jiraResponse["issues"][i]["key"]
      )}* - *${jiraResponse["issues"][i]["fields"]["summary"]}*`;
      attachments[i] = {
        fields: [
          {
            value: title,
            short: true
          },
          {
            value: `Updated ${formattedDate}`,
            short: true
          }
        ],
        color: "good",
        mrkdwn_in: ["fields"]
      };
    }
  } else {
    text += `no issues with status *${status.toUpperCase()}*`;
  }

  return SlackService.postMessage(event.channel, text, attachments, token);
};
