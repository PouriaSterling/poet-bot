const DBService = require('./DBService.js');
const JiraService = require('./JiraService.js');
const SlackService = require('./SlackService.js');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

module.exports.maintainContext = async ((message, channel) => {
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
                await (DBService.storeJiraIssueID(matches[i].toUpperCase(), channel)
                   .catch(error => console.log(`Failed to store jiraIssueID for context: ${error}`)));
               break;
           }
        }
    }
});

module.exports.fetchContextIssue = (event, token) => {
    console.log('Fetching...');
    // 1 day expressed as milliseconds. Issues in DB older than 1 day
    // are not considered relevant and are not used.
    const timeout = 86400000;

    return DBService.retrieveJiraIssueID(event.channel)
        .then(ContextIssueID => {
            if (ContextIssueID){
                console.log(`Context issue: ${ContextIssueID.issueID} @${ContextIssueID.timestamp}`);
                if (ContextIssueID.timestamp + timeout > Date.now()){
                    return ContextIssueID.issueID;
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