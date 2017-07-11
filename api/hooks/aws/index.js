module.exports = function aws_init(sails) {
  global['AWS'] = require('aws-sdk');
  AWS.config.setPromisesDependency(require('bluebird'));

  return {

    initialize: function(next) {
      var s3 = new AWS.S3();
      global['s3'] = s3;

      next();
    }

  };
};
