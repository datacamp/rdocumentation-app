/**
 * TaskViewController
 *
 * @description :: Server-side logic for managing packages
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var _ = require('lodash');
var axios = require('axios');
var numeral = require('numeral');
var querystring = require('querystring');

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
    RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {
      return TaskView.findAll({
        where:{
          in_view:null
        },
        include: [{
          model: Package,
          as: 'packages',
          through: {
            attributes: []
          }
        },
        {
          model:TaskView,
          as:'subviews',
          required:false,
          include: [{
            model:TaskView,
            as:'subviews',
            required:false,
            include: [{
              model:TaskView,
              as:'subviews',
              required:false,
              include: [{
                model:TaskView,
                as:'subviews',
                required:false
              }]
            }]
          }]
        }],
        order: [['name', 'ASC']]
      }).then(function(views) {
        views.pageTitle = 'TaskViews'
        return views;
      });
    })
    // The method above will be cached
    .then(function(views){
      return res.ok(views, 'task_view/index.ejs');
    })
    .catch(function(err) {
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
    var page = parseInt(req.param('page')) || 1;
    var view = req.param('view'),
        key = 'rdocs_view_show_' + view +'_page_'+page;

    RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {
      return TaskView.findOne({
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
        },
        {
          model:TaskView,
          as:'subviews',
          required:false,
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
            },{
            model:TaskView,
            as:'subviews',
            required:false,
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
              },{
              model:TaskView,
              as:'subviews',
              required:false,
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
                },{
                model:TaskView,
                as:'subviews',
                required:false
              }]
            }]
          }]
        }]
      }).then(function(view) {
        var jsonViews = view.toJSON();
        allPackages = jsonViews.packages;
        _.map(jsonViews.subviews,function(subview){
          _.map(subview.subviews,function(subsubview){
            _.map(subsubview.subviews,function(subsubsubview){
              allPackages = allPackages.concat(subsubsubview.packages)
            })
            allPackages = allPackages.concat(subsubview.packages)
          })
          allPackages = allPackages.concat(subview.packages)
        })
        if(allPackages.length >20){
          allPackages = allPackages.slice((page-1)*20,page*20)
          var nextPageQuery = _.clone(req.query);
          nextPageQuery.page = page + 1;
          jsonViews.nextPageUrl = req.path + '?' + querystring.stringify(nextPageQuery)
          if(page>1){
            var prevPageQuery = _.clone(req.query);
            prevPageQuery.page = page - 1;
            jsonViews.prevPageUrl = req.path + '?' + querystring.stringify(prevPageQuery)
          }
        }
        var packages = _.map(allPackages, function(package) {
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
        return jsonViews;
      })
      .catch(function(err){
        console.log(err.message)
      });
    })
    // The method above will be cached
    .then(function(view){
      if(view === null) return res.notFound();
      else {
        return res.ok(view, 'task_view/show.ejs');
      }
    });

  },

  getDownloadStatistics: function(req, res) {
    var view = req.param('view'),
    key = 'rdocs_view_download_stats_' + view;

    RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {
      return TaskView.findOne({
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
          return {total: sum, totalStr: numeral(sum).format('0,0')};
        });
      });
    })
    // The method above will be cached
    .then(function(json){
      return res.json(json);
    })
    .catch(function(err) {
      return res.negotiate(err);
    });
  },

  redirect: function(req, res) {
    var view = req.param('view');
    return res.redirect('/taskviews/' + view);
  }


};

