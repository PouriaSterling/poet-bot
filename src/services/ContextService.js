const DBService = require('./DBService.js');
const JiraService = require('./JiraService.js');
const SlackService = require('./SlackService.js');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

module.exports.maintainContextIssueID = async ((message, channel) => {
    // Collect all regex matches in an array
    var matches = message.match(/\w+-\d+/g);
    if (matches){
        // reverse search the matches array
        for (i = matches.length - 1; i >= 0; i--){
            var issueExists = true;
            // query JIRA to determine if the current match is a valid ticket number
            var response = await (JiraService.issueInfo(matches[i])
                .catch(error => {
                    if (error.message === "Issue Does Not Exist"){
                        issueExists = false;
                    }
                }));
            // store valid issueIDs in the database
            if (issueExists){
                console.log("STORING: " + matches[i]);
                await (DBService.updateChannelContext(channel, { issueID: matches[i].toUpperCase() })
                   .catch(error => console.log(`Failed to store jiraIssueID for context: ${error}`)));
               break;
           }
        }
    }
});

module.exports.fetchContextIssue = (channel, token) => {
    console.log('Fetching...');
    // 1 day expressed as milliseconds. Issues in DB older than 1 day
    // are not considered relevant and are not used.
    const timeout = 86400000;

    return DBService.retrieveChannelContext(channel)
        .then(DBReponse => {
            if (DBReponse){
                console.log(`Context issue: ${DBReponse.issueID} @${DBReponse.issueIDtimestamp}`);
                if (DBReponse.issueIDtimestamp + timeout > Date.now()){
                    return DBReponse.issueID;
                }else{
                    return "tooOld";
                }
            }else{
                return "none";
            }
        })
        .catch(error => {
            console.log("Retrieval error: " + error);
            throw new Error(error);
        });
};

// given a projectKey, find the associated Kanban board
module.exports.updateProjectKanbanBoardInfo = async ((projectKey, channel) => {
    const allBoards = await (JiraService.boardInfo('?type=kanban')
        .catch(error => {throw new Error(`Failed to get kanbanBoard info: ${error}`)}));

    for (i = 0; i < allBoards.values.length; i++){
        var board = await (JiraService.rapidViewConfigInfo(allBoards.values[i].id)
            .catch(error => {throw new Error(`Failed to get rapidViewConfigInfo: ${error}`)}));

        var projects = board.filterConfig.queryProjects.projects;
        for (j = 0; j < projects.length; j++){
            if (projects[j].key == projectKey){
                const boardID = board.id;
                await (DBService.updateChannelContext(channel, { kanbanBoardID: boardID })
                   .catch(error => console.log(`Failed to store Kanban board ID for context: ${error}`)));
                return boardID;
            }
        }
    }
    return 'notFound';
});
