/**
 * TaskViewController
 *
 * @description :: Server-side logic for managing packages
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var _ = require('lodash');
var axios = require('axios');
var numeral = require('numeral');


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
      var filtered = _.uniq(packages);
      return Package.bulkCreate(filtered.map(function(packageName) {
        return {name: packageName};
      }), {
        fields: ['name'],
        ignoreDuplicates: true
      }).then(function(created) {
        return instance.setPackages(filtered).then(function(packagesInstance) {
          return instance;
        });
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

  /**
  * @api {get} /taskviews Get all taskViews
  * @apiName Get Views
  * @apiGroup View
  * @apiDescription Return all the cran task view along with their packages
  *
  * @apiSuccess {String}    name             View name
  * @apiSuccess {String}    url              View url
  * @apiSuccess {String[]}  packages         List of Packages object
  * @apiUse Timestamps
  */

  findAll: function(req, res) {
    TaskView.findAll({
      include: [{
        model: Package,
        as: 'packages',
        through: {
          attributes: []
        }
      }],
      order: [['name', 'ASC']]
    }).then(function(views) {
      return res.ok(views, 'task_view/index.ejs');
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },

  /**
  * @api {get} /taskviews Get One Task Views
  * @apiName Get View
  * @apiGroup View
  * @apiDescription Return one view along with it's packages
  *
  * @apiSuccess {String}    name             View name
  * @apiSuccess {String}    url              View url
  * @apiSuccess {String[]}  packages         List of Packages object
  * @apiUse Timestamps
  */

  find: function(req, res) {
    var view = req.param('view');
    TaskView.findOne({
      where: {name: view },
      include: [{
        model: Package,
        as: 'packages',
        through: {
          attributes: []
        }
      }]
    }).then(function(view) {
      return res.ok(view, 'task_view/show.ejs');
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },


  getDownloadStatistics: function(req, res) {
    var view = req.param('view');

    TaskView.findOne({
      where: {name: view},
      include: [{
        model: Package,
        as: 'packages',
        through: {
          attributes: []
        }
      }]
    }).then(function(task_view) {
      var packagesString = _.map(task_view.packages, 'name').join(',');
      return axios.get('http://cranlogs.r-pkg.org/downloads/total/last-month/' + packagesString)
      .then(function(total) {
        var sum = _.sumBy(total.data, function(o) {
          return o.downloads;
        });
        return res.json({total: sum, totalStr: numeral(sum).format('0,0')});
      });
    }).catch(function(err){
      return res.negotiate(err.errors);
    });

  }


};

