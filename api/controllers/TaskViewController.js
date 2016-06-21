/**
 * TaskViewController
 *
 * @description :: Server-side logic for managing packages
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {


  /**
  * @api {post} /taskviews Create a new view
  * @apiName Create View
  * @apiGroup View
  * @apiDescription Return the newly created resource
  * Note: The Location header contains a url to the newly created resource
  *
  * @apiParam {String}  name                The name of the view to be created
  * @apiParam {String}  url                 The url of the view to be created
  * @apiParam {String[]} packages            List of package names belonging the the view
  *
  * @apiSuccess {String}    name             View name
  * @apiSuccess {String}    url              View url
  * @apiUse Timestamps
  */

  postView: function(req, res) {
    var packages = req.param('packages');
    var name = req.param('name');
    var url = req.param('url');
    var task = {
      url:url,
      name: name
    };

    console.log(name);
    console.log(task);
    TaskView.findOrCreate({
      where: {name: name},
      defaults: task,
    }).spread(function(instance, created) {
      console.log(created);
      return instance.setPackages(packages).then(function(packagesInstance) {
        return instance;
      });
    }).then(function(value) {
      res.location('/api/taskviews/' + value.name);
      res.json(value);
    }).catch(Sequelize.UniqueConstraintError, function (err) {
      return res.send(409, err.errors);
    }).catch(Sequelize.ValidationError, function (err) {
      return res.send(400, err.errors);
    }).catch(function(err){
      return res.negotiate(err);
    });
  },


};

