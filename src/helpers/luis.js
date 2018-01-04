const axios = require('axios');
//import axios from 'axios';

module.exports.process = (question) => {
    return axios.get(process.env.LUIS_URL + question)
    .then(response => {
        return response.data;
    })
    .catch(error => {
        console.log(`LuisCallError: ${error.response.data}`);
        return error.response.data;
    });
};