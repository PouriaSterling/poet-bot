const AWS = require('aws-sdk');

const database = new AWS.DynamoDB.DocumentClient();
const accessTokenTableName = process.env.ACCESS_TOKEN_TABLE_NAME;
const jiraIssueIDTableName = process.env.JIRA_ISSUE_ID_TABLE_NAME;

module.exports.storeAccessToken = (teamId, botAccessToken, userAccessToken) => {
	const params = {
		TableName: accessTokenTableName,
		Item: {
			teamId: teamId,
			botAccessToken: botAccessToken,
			userAccessToken: userAccessToken
		}
	};

	return new Promise((resolve, reject) => {
		database.put(params).promise()
			.then(result => resolve())
			.catch(error => reject(new Error(`Error storing OAuth access token: ${error}`)));
	});
};

module.exports.retrieveAccessToken = (teamId) => {
	const params = {
		TableName: accessTokenTableName,
		Key: {
			teamId: teamId
		}
	};

	return new Promise((resolve, reject) => {
		database.get(params).promise()
			.then(result => resolve(result.Item.botAccessToken))
			.catch(error => reject(new Error(`Error retrieving OAuth access token: ${error}`)));
	});
};

module.exports.storeJiraIssueID = (issueID, channel) => {
	const params = {
		TableName: jiraIssueIDTableName,
		Item: {
			channel: channel,
			issueID: issueID,
			timestamp: Date.now()
		}
	};

	return new Promise((resolve, reject) => {
		database.put(params).promise()
			.then(result => resolve())
			.catch(error => reject(new Error(`Error storing context JiraIssueID: ${error}`)));
	});
};

module.exports.retrieveJiraIssueID = (channel) => {
	const params = {
		TableName: jiraIssueIDTableName,
		Key: {
			channel: channel
		},
		AttributesToGet: ["issueID", "timestamp"]
	};

	return new Promise((resolve, reject) => {
		database.get(params).promise()
			.then(result => {
//			    console.log(`ALRIGHT: ${result.Item.issueID} @${result.Item.timestamp}`);
			    resolve(result.Item);
			})
			.catch(error => reject(new Error(`Error retrieving context JiraIssueID: ${error}`)));
	});
};