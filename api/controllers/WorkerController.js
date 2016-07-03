/**
 * WorkerController
 *
 * @description :: Server-side logic for managing Workercontrollers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */


var Promise = require('bluebird');


module.exports = {

  processMessage: function(req, res) {
    var type = req.headers['X-Aws-Sqsd-Attr-type'];
    var body =  req.body;
    if (type === 'version') {
      return TopicController.postRdFile(req, res);
    } else if (type === 'topic') {
      return PackageVersion.postDescription(req, res);
    } else {
      res.send(400, 'Invalid type');
    }
  }

};

