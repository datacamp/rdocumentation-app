var bluebird = require('bluebird');

module.exports.elasticsearch = {

  host: process.env.ELASTICSEARCH_URL,

  log: 'error',

  defer: function () {
    return bluebird.defer();
  }

};
