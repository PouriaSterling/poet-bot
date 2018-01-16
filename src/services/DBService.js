const AWS = require('aws-sdk');

const database = new AWS.DynamoDB.DocumentClient();
const accessTokenTableName = process.env.ACCESS_TOKEN_TABLE_NAME;
const channelContextTableName = process.env.CHANNEL_CONTEXT_TABLE_NAME;

module.exports.storeAccessToken = (teamId, botAccessToken) => {
	const params = {
		TableName: accessTokenTableName,
		Item: {
			teamId: teamId,
			botAccessToken: botAccessToken
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

module.exports.updateChannelContext = (channel, value, valueType) => {
    // params set to update issueID
    var expression = "set issueID = :id, issueIDtimestamp = :ts";
    var attributeValues = {
        ":id": value,
        ":ts": Date.now()
    }

    // params can be changed to update
    if (valueType === "projectKey"){
        expression = "set projectKey = :pk";
        attributeValues= {":pk": value};
    }
	const params = {
		TableName: channelContextTableName,
		Key: {
		    channel: channel
		},
		UpdateExpression: expression,
		ExpressionAttributeValues: attributeValues
	};

	return new Promise((resolve, reject) => {
		database.update(params).promise()
			.then(result => resolve())
			.catch(error => reject(new Error(`Error updating channel context: ${error}`)));
	});
};

module.exports.retrieveChannelContext = (channel) => {
	const params = {
		TableName: channelContextTableName,
		Key: {
			channel: channel
		},
		AttributesToGet: ["issueID", "issueIDtimestamp", "projectKey"]
	};

	return new Promise((resolve, reject) => {
		database.get(params).promise()
			.then(result => {
			    resolve(result.Item);
			})
			.catch(error => reject(new Error(`Error fetching channel context: ${error}`)));
	});
};