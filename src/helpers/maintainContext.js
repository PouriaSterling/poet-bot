const DBCalls = require('./dbCalls.js');
const Jira = require('../jiraCalls/issueInfo.js');

module.exports.process = (message, channel) => {
    var matches = message.match(/\w+-\d+/g);
    if (matches){
        recursiveSearch(matches, channel);
    }
};

const recursiveSearch = (matches, channel) => {
    console.log("MATCHES: " + matches);
    // check if the last element of matches is a valid JIRA issue ID
    Jira.process(matches[matches.length - 1])
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
    DBCalls.storeJiraIssueID(issueID.toUpperCase(), channel)
        .catch(error => console.log(`Failed to store jiraIssueID for context: ${error}`));
};
