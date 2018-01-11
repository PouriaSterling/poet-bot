const DBService = require('./DBService.js');
const JiraService = require('./JiraService.js');
const SlackService = require('./SlackService.js');

module.exports.maintainContext = (message, channel) => {
    var matches = message.match(/\w+-\d+/g);
    if (matches){
        recursiveSearch(matches, channel);
    }
};

const recursiveSearch = (matches, channel) => {
    console.log("MATCHES: " + matches);
    // check if the last element of matches is a valid JIRA issue ID
    JiraService.issueInfo(matches[matches.length - 1])
        .then(response => {
            if (!response['errorMessages'] || response['errorMessages'][0] !== "Issue Does Not Exist"){
                storeIssueID(matches[matches.length - 1], channel);
            }else{
                matches.pop();
                if (matches.length > 0){
                    recursiveSearch(matches, channel);
                }
            }
        })
        .catch(error => console.log("MaintainContext Error: " + error));
};

const storeIssueID = (issueID, channel) => {
    console.log("STORING: " + issueID);
    DBService.storeJiraIssueID(issueID.toUpperCase(), channel)
        .catch(error => console.log(`Failed to store jiraIssueID for context: ${error}`));
};

module.exports.fetch = (event, token) => {
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
                    SlackService.postError(`No JIRA issue has been discussed recently`, event, token);
                    return "tooOld";
                }
            }else{
                SlackService.postError(`No JIRA issue has been discussed`, event, token);
                return "none";
            }
        })
        .catch(error => {
            console.log("Retrieval error: " + error);
//            SlackService.postError("Failed to get context issue: " + error, event, token);
            throw new Error(error);
        });
};