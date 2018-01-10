const Moment = require('moment');

module.exports.timeFromNow = (date) => {
    return Moment(date).fromNow();
}