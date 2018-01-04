const DBCalls = require('./dbCalls.js');

module.exports.process = (message, channel) => {
    DBCalls.storeJiraIssueID('POET-78', channel)
        .catch(error => console.log(`Failed to store jiraIssueID for context: ${error}`));
};