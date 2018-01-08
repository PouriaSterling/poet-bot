const DBCalls = require('./dbCalls.js');

module.exports.fetch = (event, token) => {
    console.log('Fetching...');
    // 1 day expressed as milliseconds. Issues in DB older than 1 day
    // are not considered relevant and are not used.
    const timeout = 86400000;

    return DBCalls.retrieveJiraIssueID(event.channel)
        .then(ContextIssueID => {
            if (ContextIssueID){
                console.log(`Context issue: ${ContextIssueID.issueID} @${ContextIssueID.timestamp}`);
                if (ContextIssueID.timestamp + timeout > Date.now()){
                    console.log('Success');
                    return ContextIssueID.issueID;
                }else{
                    Error.report(`No JIRA issue has been discussed recently`, event, token);
                    console.log('Error1');
                    return "error";
                }
            }else{
                Error.report(`No JIRA issue has been discussed`, event, token);
                console.log('Error2');
                return "error";
            }
        })
        .catch(error => {
            console.log("Retrieval error: " + error);
            Error.report("Failed to get context issue: " + error, event, token);
            return "error";
        });
};