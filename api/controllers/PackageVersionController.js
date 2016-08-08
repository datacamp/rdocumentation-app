/**
 * PackageVersionController
 *
 * @description :: Server-side logic for managing packageversions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var axios = require('axios');
var _ = require('lodash');
var numeral = require('numeral');
var Promise = require('bluebird');
var autoLink = require('autolink-js');


module.exports = {

  /**
  * @api {post} /versions Create a new PackageVersion
  * @apiName Create PackageVersion
  * @apiGroup PackageVersion
  *
  * @apiDescription Create a new PackageVersion from a parsed DESCRIPTION file, for more information
  * about the fields and their semantic, visit https://cran.r-project.org/doc/manuals/r-release/R-exts.html#The-DESCRIPTION-file
  * Note: the Location header of the response is set to the url pointing to the newly created resource
  *
  * @apiParam {String}  PackageName  Name of the package.
  * @apiParam {String}  Title        Title of the package version.
  * @apiParam {String}  Version      String representation of the version of the package
  * @apiParam {Date}    [Date]         ISO8601 Date formatted representing the release date of the version
  * @apiParam {String}  Maintainer   Name and email of the maintainer, email is mandatory and must be delimited by `<>`, `<email></email>` or `()`
  * @apiParam {String}  Description  Description of the package version
  * @apiParam {String}  License      License used for the package version
  * @apiParam {String}  [URL]        Comma separated list of url pointing to useful resources
  * @apiParam {String}  [Copyright]  Information about copyright
  * @apiParam {String}  [Author]     Comma separated list of package author, email are optional but must be delimited by `<>`, `<email></email>` or `()`
  * @apiParam {String}  [Depends]    Comma separated list of packages dependencies
  * @apiParam {String}  [Import]     Comma separated list of imported packages
  * @apiParam {String}  [Suggests]   Comma separated list of suggested packages
  * @apiParam {String}  [Enhances]   Comma separated list of enhanced packages

  @apiError 400 ValidationError
  @apiError 409 ConflictError A package version with the same package name and version already exists

  */
  postDescription: function(req, res) {
    var result = PackageVersion.createWithDescriptionFile({input: req.body});
    result.then(function(value) {
      res.location('/api/packages/' + value.package_name + '/versions/' + value.version);
      key = 'view_package_version_' + value.package_name + '_' + value.version;
      RedisClient.del(key);
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
  * @api {get} /packages/:name/versions/:version Request PackageVersion information
  * @apiName Get PackageVersion
  * @apiGroup PackageVersion
  *
  * @apiParam {String} name Name of the package
  * @apiParam {String} version Version of the package
  *
  * @apiUse Timestamps
  * @apiSuccess {String}   uri              Url to this package version
  * @apiSuccess {String}   package_uri      Url to the package of this version
  * @apiSuccess {String}   id               Id of this version
  * @apiSuccess {String}   package_name     Name of the package of this version
  * @apiSuccess {String}   version          String describing the version of the package
  * @apiSuccess {String}   title            Title of the version
  * @apiSuccess {String}   description      Description of the package version
  * @apiSuccess {Date}     release_date     Release date of the package version
  * @apiSuccess {String}   license          License of the package version
  * @apiSuccess {String}   maintainer_id    Id of the maintainer of the package version
  * @apiSuccess {Object}   maintainer       Description of the maintainer of this package version
  * @apiSuccess {String}   maintainer.name  Name of the maintainer of the package version
  * @apiSuccess {String}   maintainer.email Email of the maintainer of the package version
  * @apiSuccess {Object[]} authors          List of the authors of this package version
  * @apiSuccess {String}   authors.name     Name of this author of the package version
  * @apiSuccess {String}   authors.email    Email of this author of the package version
  * @apiSuccess {Object[]} topics           List of topics (only name and title) (limited to 30)


  */
  findByNameVersion: function(req, res) {
    var packageName = req.param('name'),
        packageVersion = req.param('version'),
        key = 'view_package_version_' + packageName + '_' + packageVersion;

    RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {
      return PackageVersion.getPackageVersionFromCondition({package_name:packageName, version:packageVersion});
    })
    // The method above will be cached
    .then(function(version){
      if(version === null) return res.redirect(301, '/packages/' + encodeURIComponent(packageName));
      else {
        version.pageTitle = version.package_name + ' v' + version.version;
        try {
          version.sourceJSON = JSON.parse(version.sourceJSON);
          version.sourceJSON = _.omit(version.sourceJSON, ['Package',
            'Version',
            'Title',
            'Author',
            'Authors@R',
            'Maintainer',
            'repoType',
            'readme',
            'Description',
            'Depends',
            'Imports',
            'Suggests',
            'Enhances']);
        } catch(err) {
          version.sourceJSON = {};
        }
        console.log(version.sourceJSON);
        return res.ok(version, 'package_version/show.ejs');
      }
    })
    .catch(function(err) {
      return res.negotiate(err);
    });

  },

  _getDownloadStatistics: function (res, packageName) {
    key = 'rdocs_download_stats_' + packageName;

    return RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {
      return sequelize.query("SELECT DISTINCT package_name FROM Dependencies INNER JOIN PackageVersions on PackageVersions.id = Dependencies.dependant_version_id WHERE dependency_name = ? and type = 'depends'", { replacements: [packageName], type: sequelize.QueryTypes.SELECT})
        .then(function(data) {
          var packageNames = _.map(data, 'package_name');
          return packageNames.join(',');
        })
        .then(function(queryString) {
          function getTotalDownloads() {
            return axios.get('http://cranlogs.r-pkg.org/downloads/total/last-month/' + packageName);
          }

          function getRevDepsDownloads() {
            return axios.get('http://cranlogs.r-pkg.org/downloads/total/last-month/' + queryString);
          }

          return new Promise(function(resolve) {

            axios.all([getTotalDownloads(), getRevDepsDownloads()]).then(axios.spread(function (total, revDeps) {
              var totalJSON = total.data[0],
              revDepsJSON = revDeps.data;
              total = totalJSON.downloads;
              revDeps = _.sumBy(revDepsJSON, function(o) { return o.downloads; });

              var json = {total: total, revDeps: revDeps, totalStr: numeral(total).format('0,0'), revDepsStr: numeral(revDeps).format('0,0') };

              resolve(json);
            }));

          });

        });
    });

  },

  getDownloadStatistics: function(req, res) {
    var packageName = req.param('name');

    sails.controllers.packageversion._getDownloadStatistics(res, packageName).then(function(json) {
      json.fromCache ? res.set('X-Cache', 'hit') : res.set('X-Cache', 'miss');
      res.set('Cache-Control', 'max-age=' + RedisService.DAILY);
      return res.json(json);
    });
  },

  getSplittedDownloadStatistics : function(req,res){
    var packageName = req.param('name');

    DownloadStatistic.getMonthlySplittedDownloads(packageName).then(function(stats){
      return res.json({
        directDownloadsStr: numeral(stats[0].direct_downloads).format('0,0'),
        indirectDownloadsStr: numeral(stats[0].indirect_downloads).format('0,0'),
        totalStr: numeral(stats[0].direct_downloads + stats[0].indirect_downloads).format('0,0'),
        directDownloads: stats[0].direct_downloads,
        indirectDownloads: stats[0].indirect_downloads,
        total: stats[0].direct_downloads + stats[0].indirect_downloads
      });
    });

  },

  getPercentile: function(req, res) {
    var packageName = req.param('name');

    var lastMonthPercentiles = ElasticSearchService.cachedLastMonthPercentiles(res);

    var lastMonthDownload = sails.controllers.packageversion._getDownloadStatistics(res, packageName);

    Promise.join(lastMonthPercentiles, lastMonthDownload, function(percentilesResponse, downloads) {
      var total = downloads.total;

      var percentiles = _.omit(percentilesResponse, 'fromCache');
      var percentile = _.findLastKey(percentiles, function(p) {
        return total >= p;
      });

      return res.json({total: total, percentile: Math.round(percentile * 100) / 100 });
    });
  },

  getLastMonthDownloadPerDay: function(req, res) {
    var packageName = req.param('name');
    DownloadStatistic.lastMonthSplittedDownloadsPerDay(packageName).then(function(data) {
      var serie = data.map(function(d) {
        return [{
          timestamp: d.date,
          key:"direct_downloads",
          count: d.direct_downloads,
        },{
          timestamp: d.date,
          key:"indirect_downloads",
          count:d.indirect_downloads
        }];
      });
      serie=[].concat.apply([],serie);
      return res.json(serie);
    });
  },

  getDependencyGraph: function(req,res) {
    var packageName = req.param('name');
    var nodes = [packageName];
    var nodelist =[{
      name: packageName,
      group: 0}];
    return Dependency.findByDependant(packageName).then(function(deps){
      var dependencies =[];
      deps.forEach(function(dep,i){
        nodes.push(dep.dependency_name);
        nodelist.push({
          name: dep.dependency_name,
          group: i+1
        });
      dependencies.push({
        source : nodes.indexOf(dep.dependency_name),
        target : nodes.indexOf(packageName),
        value  : 10
      });
      });
      return Promise.map(deps,function(dep,i){
        return Dependency.findByDependant(dep.dependency_name).then(function(deps2){
          deps2.forEach(function(dep2){
            if(nodes.indexOf(dep2.dependency_name)==-1){
              nodes.push(dep2.dependency_name);
              nodelist.push({
                name: dep2.dependency_name,
                group: i+1
              });
            }
            dependencies.push({
              source : nodes.indexOf(dep2.dependency_name),
              target : nodes.indexOf(dep.dependency_name),
            });
          });
        });
      },{concurrency: 1}).then(function(){
          return res.json({
            nodes: nodelist,
            links: dependencies
          });
        });
    });
  },

  getReverseDependencyGraph: function(req,res) {
    var rootPackage = req.param('name');

    return Dependency.findIndirectReverseDependencies(rootPackage).then(function(deps){
      var rootIndex = 0;
      var firstLevel = _.groupBy(deps, 'direct_reverse_dependencies');
      var firstLevelPackages = _.keys(firstLevel);
      var nodes = _.map(firstLevelPackages, function(name, i) {
        return {
          name: name,
          group: i + 1
        };
      });

      //prepend the root
      nodes.unshift({
        name: rootPackage,
        group: 0
      });

      var nodeIndices = _.reduce(nodes, function(acc, node) {
        acc[node.name] = node.group;
        return acc;
      }, {});

      var links = [];
      _.forEach(firstLevelPackages, function(name, i) {
        var idx = i + 1;
        links.push({
          source: idx,
          target: rootIndex,
          value: 10
        });
        var secondLevel = _.map(firstLevel[name], 'indirect_reverse_dependencies');
        _.forEach(secondLevel, function(name, i) {
          if(typeof nodeIndices[name] === 'undefined') {
            var newLength = nodes.push({
              name: name,
              group: idx
            });
            nodeIndices[name] = newLength - 1;
          }

          links.push({
            source: nodeIndices[name],
            target: idx
          });
        });
      });

      return res.json({
        nodes: nodes,
        links: links
      });
    });

  },

  getDownloadPerDayLastDays:function(req,res){
    var packageName=req.param('name');
    var days = parseInt(req.param('days'));
    if(days>30){
      return ElasticSearchService.lastDaysPerDay(packageName,days).then(function(data){
        var serie=data.map(function(d){
          return {
            timestamp:d.key_as_string,
            key:"total_downloads",
            count:d.doc_count
          };
        });
        return res.json(serie);
      });
    }
    else{
      return DownloadStatistic.lastDaysSplittedDownloadsPerDay(packageName,days).then(function(data){
        var serie = data.map(function(d) {
        return [{
          timestamp: d.date,
          key:"direct_downloads",
          count: d.direct_downloads,
        },{
          timestamp: d.date,
          key:"indirect_downloads",
          count:d.indirect_downloads
        }];
      });
      serie=[].concat.apply([],serie);
      return res.json(serie);
      });
    }
  }

};

