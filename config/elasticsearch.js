var bluebird = require('bluebird');

module.exports.elasticsearch = {

  host: 'http://ec2-54-67-61-189.us-west-1.compute.amazonaws.com:9200',

  log: 'trace',

  defer: function () {
    return bluebird.defer();
  }

};
