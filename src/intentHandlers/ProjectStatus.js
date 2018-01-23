const ContextService = require('../services/ContextService.js');
const SlackService = require('../services/SlackService.js');
const JiraService = require('../services/JiraService.js');
const DBService = require('../services/DBService.js');
const Utils = require('../services/Utils.js');
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

    // update the context database timestamps only once a day
    if (ContextResponse.newestTS){
        if (ContextResponse.newestTS != Utils.todaysDate()){
            if (ContextResponse.middleTS){
                const tempTS1 = ContextResponse.newestTS;
                const tempTS2 = ContextResponse.middleTS;
                await (DBService.updateChannelContext(event.channel, { newestTS: Utils.todaysDate() , middleTS: tempTS1 , oldestTS: tempTS2 })
                   .catch(error => console.log(`Failed to update project status timestamps: ${error}`)));
            }else{
                const tempTS = ContextResponse.newestTS;
                await (DBService.updateChannelContext(event.channel, { newestTS: Utils.todaysDate() , middleTS: tempTS })
                   .catch(error => console.log(`Failed to update project status timestamps: ${error}`)));
            }
        }
    }else{
        await (DBService.updateChannelContext(event.channel, { newestTS: Utils.todaysDate() })
           .catch(error => console.log(`Failed to update project status timestamps: ${error}`)));
    }

    /****** Kanban Checks ******/
    const kanbanCheckResults = await (kanbanChecks(projectKey, kanbanBoardID, backlogStatusIDs, ContextResponse.middleTS, ContextResponse.oldestTS));
    /****** Backlog Checks *****/
    const backlogCheckResults = await (backlogChecks(projectKey, kanbanBoardID, backlogStatusIDs, ContextResponse.middleTS, ContextResponse.oldestTS));
    /****** Report Checks ******/
    const reportCheckResults = await (reportChecks(projectKey, kanbanBoardID));

    // Send the Slack responses in order
    const text = `Here is the current status of the project *${JiraService.HyperlinkJiraProjectKey(projectKey, name)}*`;
    await (SlackService.postMessage(event.channel, text + '\n:one: Kanban Checks:', kanbanCheckResults, token));
    await (SlackService.postMessage(event.channel, ':two: Backlog Checks:', backlogCheckResults, token));
    await (SlackService.postMessage(event.channel, ':three: Report Checks:', reportCheckResults, token));
});


const kanbanChecks = async ((projectKey, kanbanBoardID, backlogStatusIDs, middleTS, oldestTS) => {
    var kanbanChecks = [];
    // TODO report any red columns


    // TODO list newly created tickets in the last week


    // TODO list tickets not updated in last week (highlight if in Stalled, In Progress or Completed)


    // TODO report if ticket (> 3 story points) are in same column


    if (kanbanChecks.length == 0){
        kanbanChecks.push({"text": 'Kanban is all good! :white_check_mark:' , "color": "good"});
    }
    return kanbanChecks;
});


const reportChecks = async ((projectKey, kanbanBoardID) => {
    var reportChecks = [];
    // TODO provide links to the two charts
    const reportInfo = await (JiraService.reportsInfo(kanbanBoardID)
        .catch(error => {throw new Error(`Error getting reportInfo for kanbanBoardID ${kanbanBoardID}: ${error}`)}));

    // extract column id's for the desired columns in report. Use them to build report links
    var controlChartColumns = [];
    var cumulativeFlowColumns = [];
    for (i = 0; i < reportInfo.columns.length; i++){
        const name = reportInfo.columns[i].name;
        if (name === 'Stalled' || name === 'In Progress' || name === 'Completed'){
            controlChartColumns.push(reportInfo.columns[i].id);
        }
        if (name !== 'Backlog'){
            cumulativeFlowColumns.push(reportInfo.columns[i].id);
        }
    }

    // construct the Control Chart and Cumulative Flow Diagram links
    const controlChartLink = `${process.env.JIRA_URL}/secure/RapidBoard.jspa?rapidView=${kanbanBoardID}&projectKey=${projectKey}&view=reporting&chart=controlChart&days=14&column=${controlChartColumns.join('&column=')}`;
    const CumulativeDiagramLink = `${process.env.JIRA_URL}/secure/RapidBoard.jspa?rapidView=${kanbanBoardID}&projectKey=${projectKey}&view=reporting&chart=cumulativeFlowDiagram&days=14&column=${cumulativeFlowColumns.join('&column=')}`;
    reportChecks.push({"text": `:exclamation:Check the <${controlChartLink}|Control Chart> and <${CumulativeDiagramLink}|Cumulative Flow Diagram>.`, "color": "danger"});

    if (reportChecks.length == 0){
        reportChecks.push({"text": 'Reports are all good! :white_check_mark:' , "color": "good"});
    }
    return reportChecks;
});


const backlogChecks = async ((projectKey, kanbanBoardID, backlogStatusIDs, middleTS, oldestTS) => {
    var backlogChecks = [];
    // TODO list newly created tickets in the last week or since the last checked date
    var createdRecentlyIssues;
    var createdPreviouslyIssues;
    var lastCheck;
    if (!middleTS){
        // show for last week
        createdRecentlyIssues = await (JiraService.boardInfo(`${kanbanBoardID}/issue?jql=status in (${backlogStatusIDs.join(',')}) and issueType!= Epic and createdDate >= -1w`)
            .catch(error => {throw new Error(`error getting backlogIssues 1: ${error}`)}));
        lastCheck = "a week ago";
    }else{
        // query JIRA for issues between newestTS and Utils.todaysDate()
        createdRecentlyIssues = await (JiraService.boardInfo(`${kanbanBoardID}/issue?jql=status in (${backlogStatusIDs.join(',')}) and issueType!= Epic and createdDate>="${middleTS}"`)
            .catch(error => {throw new Error(`error getting backlogIssues 2: ${error}`)}));
        if (oldestTS){
            // "Here is a reminder of the new tickets from last time"
            // query JIRA for issues between oldestTS and newestTS
            createdPreviouslyIssues = await (JiraService.boardInfo(`${kanbanBoardID}/issue?jql=status in (${backlogStatusIDs.join(',')}) and issueType!= Epic and createdDate>="${oldestTS}" and createdDate<"${middleTS}"`)
                .catch(error => {throw new Error(`error getting backlogIssues 3: ${error}`)}));
        }
        lastCheck = Utils.timeFromNow(middleTS);
    }

    const total1 = createdRecentlyIssues.total;
    var total2 = -1;
    if (createdPreviouslyIssues){
        total2 = createdPreviouslyIssues.total;
    }

    if (total1 > 0){
        backlogChecks.push({
                                "text": `:exclamation: There are ${total1} new issues in the backlog since your last check ${lastCheck}:${returnIssues(createdRecentlyIssues)}`,
                                "color": "danger",
                                "mrkdwn_in": ["text"]
                            });
    }else{
        backlogChecks.push({
                                "text": `No new issues in backlog since your last check ${lastCheck} :white_check_mark:`,
                                "color":"good",
                                "mrkdwn_in": ["text"]
                            });
    }
    if (total2 > 0){
        backlogChecks.push({
                                "text": `:exclamation: As a reminder, here is a list of the newly created issues I showed you ${Utils.timeFromNow(oldestTS)}:${returnIssues(createdPreviouslyIssues)}`,
                                "color": "danger",
                                "mrkdwn_in": ["text"]
                            });
    }

    // TODO list tickets not updated in last week. Are they still valid?
    notUpdatedRecentlyIssues = await (JiraService.boardInfo(`${kanbanBoardID}/issue?jql=status in (${backlogStatusIDs.join(',')}) and issueType!= Epic and updatedDate <= -1w ORDER BY updated ASC`)
       .catch(error => {throw new Error(`error getting backlogIssues 1: ${error}`)}));
    const total3 = notUpdatedRecentlyIssues.total;
    if (total3 > 0){
        backlogChecks.push({
                                "text": `:exclamation: There are ${total3} issues not updated in more than a week. Are they still relevant? ${returnIssues(notUpdatedRecentlyIssues)}`,
                                "color": "danger",
                                "mrkdwn_in": ["text"]
                            });
    }

    // TODO show backlog order so they can confirm the priority
    const link = `${process.env.JIRA_URL}/secure/RapidBoard.jspa?projectKey=${projectKey}&rapidView=${kanbanBoardID}&view=planning`;
    backlogChecks.push({"text": `:exclamation:Check the <${link}|project backlog> to ensure the issues are prioritised correctly.`, "color": "danger"});

    if (backlogChecks.length == 0){
        backlogChecks.push({"text": "Backlog is all good! :white_check_mark:" , "color": "good"});
    }
    return backlogChecks;
});

// return a list of new-line ended JIRA ticket information in the form 'JIRA_KEY - JIRA_SUMMARY (TIME_AGO)'
const returnIssues = (JiraResponse) => {
    var result = '';
    const numOfIssues = JiraResponse.total;
    if (numOfIssues > 0){
        for (i = 0; i < numOfIssues; i++){
            var titles = `*${JiraService.HyperlinkJiraIssueID(JiraResponse['issues'][i]['key'])}* - *${JiraResponse['issues'][i]['fields']['summary']}*`;
            var timeAgos = Utils.timeFromNow(JiraResponse['issues'][i]["fields"]['updated']);
            result += `\n${titles} (${timeAgos})`;
        }
    }
    return result;
};
