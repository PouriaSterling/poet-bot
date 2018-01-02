const axios = require('axios');
//import axios from 'axios';

module.exports.process = (question) => {
    return axios.get(process.env.LUIS_URL + question)
    .then(function (response) {
        return response.data;
    })
};