const ContextService = require('../services/ContextService.js');
const SlackService = require('../services/SlackService.js');
const JiraService = require('../services/JiraService.js');
const DBService = require('../services/DBService.js');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

module.exports.process = async ((event, token) => {
    // get the context information for this channel
    const ContextResponse = await (DBService.retrieveChannelContext(event.channel)
        .catch(error => {throw new Error(`Failed to fetch project key for channel context: ${error}`)}));

    if (!ContextResponse || !ContextResponse.projectKey){
        throw new Error("Please set a channel project first using e.g. '@poet Set the project to POET'");
    }

    // get the project Kanban board ID from DB, updating it if its not there
    const projectKey = ContextResponse.projectKey;
    var kanbanBoardID = ContextResponse.kanbanBoardID || null;
    if (!kanbanBoardID){
        //Update all Project kanban information
        kanbanBoardID = await (ContextService.updateProjectKanbanBoardInfo(projectKey, event.channel));
        if (kanbanBoardID === 'notFound'){
            throw new Error(`Couldn't find a *Kanban board* for the project *${projectKey}*`);s
        }
    }
    // get the project info
    const jiraResponse = await (JiraService.projectInfo(projectKey)
        .catch(error => {throw new Error(`Error in *Project Status* while fetching project information for *${projectKey}*":\n${error.message}`)}));
    const name = jiraResponse['name'];

    // get the Kanban configuration information for the project
    const boardConfig = await (JiraService.boardInfo(`${kanbanBoardID}/configuration`)
        .catch(error => {throw new Error(`error getting board/${kanbanBoardID}/configuration: ${error}`)}));
    const columns = boardConfig.columnConfig.columns;

    // find the backlog column and extract its statuses
    const backlogStatusIDs = [];
    for (i = 0; i < columns.length; i++){
        if (columns[i].name.toUpperCase() === 'BACKLOG'){
            for (j = 0; j < columns[i].statuses.length; j++){
                backlogStatusIDs.push(columns[i].statuses[j].id);
            }
            break;
        }
    }

    /* Kanban Checks *******************************************************************************/
    var kanbanChecks = [];
    // TODO report any red columns
//    kanbanChecks.push('There are 2 red columns! They are: ');

    // TODO list newly created tickets in the last week


    // TODO list tickets not updated in last week (highlight if in Stalled, In Progress or Completed)

    // TODO report if ticket (> 3 story points) are in same column

    if (kanbanChecks.length == 0){
        kanbanChecks.push(':white_check_mark: Kanban is all good!');
    }

    /* Backlog Checks ******************************************************************************/
    var backlogChecks = [];
    // TODO list newly created tickets in the last week
//    backlogChecks.push('Are you familiar with all these tickets created in the last week?');
    // TODO list tickets not updated in last week. Are they still valid?

    // TODO show backlog order so they can confirm the priority
    if (backlogStatusIDs.length > 0){
        const backlogIssues = await (JiraService.boardInfo(`${kanbanBoardID}/issue?jql=status in (${backlogStatusIDs.join(',')}) and issueType!= Epic`)
            .catch(error => {throw new Error(`error getting backlogIssues: ${error}`)}));
        const backlogTotal = backlogIssues.total;
        if (backlogTotal > 0){
            const link = `https://jira.agiledigital.com.au/secure/RapidBoard.jspa?projectKey=${projectKey}&rapidView=${kanbanBoardID}&view=planning`;
            backlogChecks.push(`Check that the ${backlogIssues.total} issues in the backlog are prioritised based on team members on project and those expected to contribute to project. To revise the order, go <${link}|here>.`);
            for (i = 0; i < backlogTotal; i++){
                backlogChecks.push(`    ${i+1}. ${JiraService.HyperlinkJiraIssueID(backlogIssues.issues[i].key)} - ${backlogIssues.issues[i].fields.summary}`);
            }
        }
    }

    if (backlogChecks.length == 0){
        backlogChecks.push(':white_check_mark: Backlog is all good!');
    }

    /* Report Checks *******************************************************************************/
    var reportChecks = [];
    // TODO provide links to the two charts
//    reportChecks.push('Follow these two links and check the charts...');

    if (reportChecks.length == 0){
        reportChecks.push(':white_check_mark: Reports are all good!');
    }

    // prepare the Slack response
    const text = `Here is the current status of the project *${JiraService.HyperlinkJiraProjectKey(projectKey, name)}*`;
    const attachments = [
        {
            "title": `Kanban Checks:`,
            "text": kanbanChecks.join('\n'),
            "color": "good",
            "mrkdwn_in": ["text"]
        },
        {
            "title": `Backlog Checks:`,
            "text": backlogChecks.join('\n'),
            "color": "good",
            "mrkdwn_in": ["text"]
        },
        {
            "title": `Report Checks:`,
            "text": reportChecks.join('\n'),
            "color": "good",
            "mrkdwn_in": ["text"]
        }
    ];
    SlackService.postMessage(event.channel, text, attachments, token);
});
