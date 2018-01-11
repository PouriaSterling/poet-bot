const axios = require('axios');

module.exports.interpretQuery = (question) => {
    return axios.get(process.env.LUIS_URL + question)
    .then(response => {
        return response.data;
    })
    .catch(error => {
        console.log(`LuisCallError: ${error.response.data}`);
        return error.response.data;
    });
};