const DBService = require("./DBService.js");
const JiraService = require("./JiraService.js");
const SlackService = require("./SlackService.js");

module.exports.maintainContextIssueID = async (message, channel) => {
  // Collect all regex matches in an array
  var matches = message.match(/\w+-\d+/g);
  if (matches) {
    // reverse search the matches array
    for (i = matches.length - 1; i >= 0; i--) {
      var issueExists = true;
      // query JIRA to determine if the current match is a valid ticket number
      var response = await JiraService.issueInfo(matches[i]).catch(error => {
        if (error.message === "Issue Does Not Exist") {
          issueExists = false;
        }
      });
      // store valid issueIDs in the database
      if (issueExists) {
        console.log("STORING: " + matches[i]);
        await DBService.updateChannelContext(channel, {
          issueID: matches[i].toUpperCase()
        }).catch(error =>
          console.log(`Failed to store jiraIssueID for context: ${error}`)
        );
        break;
      }
    }
  }
};

module.exports.fetchContextIssue = (channel, token) => {
  console.log("Fetching...");
  // 1 day expressed as milliseconds. Issues in DB older than 1 day
  // are not considered relevant and are not used.
  const timeout = 86400000;

  return DBService.retrieveChannelContext(channel)
    .then(DBReponse => {
      if (DBReponse) {
        console.log(
          `Context issue: ${DBReponse.issueID} @${DBReponse.issueIDtimestamp}`
        );
        if (DBReponse.issueIDtimestamp + timeout > Date.now()) {
          return DBReponse.issueID;
        } else {
          return "tooOld";
        }
      } else {
        return "none";
      }
    })
    .catch(error => {
      console.log("Retrieval error: " + error);
      throw new Error(error);
    });
};

// given a projectKey, find the associated Kanban board
module.exports.updateProjectKanbanBoardInfo = async (projectKey, channel) => {
  const allBoards = await JiraService.boardInfo(
    `?type=kanban&projectKeyOrId=${projectKey}`
  ).catch(error => {
    throw new Error(`Failed to get kanbanBoard info: ${error}`);
  });

  let boardId = "notFound";

  if (allBoards.values.length > 0) {
    if (allBoards.values.length > 1) {
      console.log(
        `updateProjectKanbanBoardInfo: found multiple boards for project ${projectKey}`
      );
    }
    if ("id" in allBoards.values[0]) {
      boardId = allBoards.values[0].id;
    } else {
      console.log(`updateProjectKanbanBoardInfo: board had no id`);
    }
  }
  return boardId;
};
