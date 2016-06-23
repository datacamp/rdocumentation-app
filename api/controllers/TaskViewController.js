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
    var key = 'rdocs_view_index';
    RedisClient.getAsync(key).then(function(response){
      if(response) {
        res.set('X-Cache', 'hit');
        return res.ok(JSON.parse(response), 'task_view/index.ejs');
      } else {
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
          views.pageTitle = 'TaskViews'
          RedisClient.set(key, JSON.stringify(views));
          RedisClient.expire(key, 86400);
          res.set('X-Cache', 'miss');
          return res.ok(views, 'task_view/index.ejs');
        }).catch(function(err) {
          return res.negotiate(err);
        });
      }
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
    var view = req.param('view'),
        key = 'rdocs_view_show_' + view;

    RedisClient.getAsync(key).then(function(response){
      if(response) {
        res.set('X-Cache', 'hit');
        return res.ok(JSON.parse(response), 'task_view/show.ejs');
      } else {
        TaskView.findOne({
          where: {name: view },
          include: [{
            model: Package,
            as: 'packages',
            through: {
              attributes: []
            },
            include: [{
              model: PackageVersion,
              as: 'latest_version',
              include: [{
                model: Review,
                as: 'reviews'
              }],
              attributes: ['id', 'title', 'description']
            }]
          }]
        }).then(function(view) {
          var jsonViews = view.toJSON();
          var packages = _.map(jsonViews.packages, function(package) {
            var rating;
            if(!package.latest_version || package.latest_version.reviews.length === 0) {
              rating = 0;
            } else {
              rating = _.meanBy(package.latest_version.reviews, function(r) {
                return r.rating;
              });
            }
            package.rating = rating;
            return package;
          });
          jsonViews.packages = packages;
          jsonViews.pageTitle = view.name;
          RedisClient.set(key, JSON.stringify(jsonViews));
          RedisClient.expire(key, 86400);
          res.set('X-Cache', 'miss');
          return res.ok(jsonViews, 'task_view/show.ejs');
        }).catch(function(err) {
          return res.negotiate(err);
        });
      }
    });
  },


  getDownloadStatistics: function(req, res) {
    var view = req.param('view'),
    key = 'rdocs_view_download_stats_' + view;
    RedisClient.getAsync(key).then(function(response){
      if(response) {
        res.set('X-Cache', 'hit');
        res.set('Cache-Control', 'max-age=' + 86400);
        return res.json(JSON.parse(response));
      } else {
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
            var json = {total: sum, totalStr: numeral(sum).format('0,0')};
            RedisClient.set(key, JSON.stringify(json));
            RedisClient.expire(key, 86400);
            res.set('X-Cache', 'miss');
            res.set('Cache-Control', 'max-age=' + 86400);
            return res.json(json);
          });
        }).catch(function(err){
          return res.negotiate(err.errors);
        });
      }
    });

  },

  redirect: function(req, res) {
    var view = req.param('view');
    return res.redirect('/taskviews/' + view);
  }


};

