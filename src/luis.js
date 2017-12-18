const axios = require('axios');
//import axios from 'axios';

const luisDetails = {
	url: process.env.LUIS_URL,
	appID: process.env.LUIS_APPID,
	key: process.env.LUIS_SUBSCRIPTION_KEY,
	timeZoneOffset: process.env.LUIS_TIMEZONE_OFFSET
};

module.exports.process = (question) => {
    return axios.get(luisDetails.url, {
        params: {
            timeZoneOffset: luisDetails.timeZoneOffset,
            "subscription-key": luisDetails.key,
            q: question
        }
    })
    .then(function (response) {
        return response.data;
    })
};