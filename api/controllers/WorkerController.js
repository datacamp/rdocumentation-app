/**
 * WorkerController
 *
 * @description :: Server-side logic for managing Workercontrollers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */


var Promise = require('bluebird');


module.exports = {

  processMessage: function(req, res) {
    var type = req.headers['x-aws-sqsd-attr-type'];
    var body =  req.body;

    if (type === 'topic') {
      var packageName = req.body.package.package;
      var packageVersion = req.body.package.version;
      var result = Topic.createWithRdFile({input: req.body, packageName: packageName, packageVersion: packageVersion});
      result.then(function(value) {
        key = 'view_topic_' + value.id;
        RedisClient.del(key);
        res.json(value);
      })
      .catch(Sequelize.UniqueConstraintError, function (err) {
        return res.send(409, err.errors);
      }).catch(Sequelize.ValidationError, function (err) {
        return res.send(400, err.errors);
      }).catch(function(err){
          return res.negotiate(err.errors);
      });

    } else if (type === 'version') {
      return sails.controllers.packageversion.postDescription(req, res);
    } else {
      res.send(400, 'Invalid type');
    }
  }

};

