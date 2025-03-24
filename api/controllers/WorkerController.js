/**
 * WorkerController
 *
 * @description :: Server-side logic for managing Workercontrollers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */


var Promise = require('bluebird');
var _ = require('lodash');

module.exports = {

  processMessage: function(req, res) {
    var type = req.headers['x-aws-sqsd-attr-type'];
    var body =  req.body;

    if (type === 'topic') {
      var packageName = req.body.package.package;
      var packageVersion = req.body.package.version;
      var result = Topic.createWithRdFile({input: req.body, packageName: packageName, packageVersion: packageVersion});
      result.then(function(value) {
        var key = 'view_topic_' + value.id;
        RedisService.invalidateTopicById(key);
        res.json(value);
      })
      .catch(Sequelize.UniqueConstraintError, function (err) {
        console.log('SequelizeError - UniqueConstraintError:', err);
        var errorResponse = err.errors || [{message: 'Unique constraint violation'}];
        return res.send(409, errorResponse);
      }).catch(Sequelize.ValidationError, function (err) {
        console.log('SequelizeError - ValidationError:', err);
        var errorResponse = err.errors || [{message: 'Validation error'}];
        return res.send(400, errorResponse);
      }).catch(function(err){
        console.log('Unhandled error in Topic.createWithRdFile:', err);
        var errorResponse = [];
        if (err.errors && Array.isArray(err.errors)) {
          errorResponse = [...err.errors, "Other"];
        } else if (err.errors) {
          errorResponse = [{message: String(err.errors)}, "Other"];
        } else {
          errorResponse = [{message: err.message || "Unknown error occurred"}, "Other"];
        }
        return res.negotiate(errorResponse);
      });

    } else if (type === 'version') {
      return sails.controllers.packageversion.postDescription(req, res);
    } else {
      res.send(400, 'Invalid type');
    }
  }


};

