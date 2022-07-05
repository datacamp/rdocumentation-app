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
        // console.log(value);
        res.json(value);
      })
      .catch(Sequelize.UniqueConstraintError, function (err) {
        console.log('Sequelize.UniqueConstraintError: ', err.errors);
        return res.send(409, [...err.errors, "Sequalize.UniqueConstraintError"]);
      }).catch(Sequelize.ValidationError, function (err) {
        console.log('Sequelize.ValidationError: ', err.errors);
        return res.send(400, [...err.errors, "Sequalize.ValidationError"]);
      }).catch(function(err){
        console.log(err.errors);
        return res.negotiate([...err.errors, "Other"]);
      });

    } else if (type === 'version') {
      return sails.controllers.packageversion.postDescription(req, res);
    } else {
      res.send(400, 'Invalid type');
    }
  }


};

