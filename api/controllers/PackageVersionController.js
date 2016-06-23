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


_getDownloadStatistics = function (packageName) {
  key = 'rdocs_download_stats_' + packageName;

  return RedisService.getJSONFromCache(key, 86400, function() {
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

};


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
    var packageName = req.param('name');
    var packageVersion = req.param('version');

    PackageVersion.findOne({
      where: {
        package_name: packageName,
        version: packageVersion
      },
      include: [
        { model: Collaborator, as: 'maintainer' },
        { model: Collaborator, as: 'collaborators' },
        { model: Package, as: 'dependencies' },
        { model: Package, as: 'package', include: [
          { model: PackageVersion, as: 'versions'},
        ]},
        { model: Topic, as: 'topics', separate: true},
        { model: Review, as: 'reviews', separate: true,
          include: [{model: User, as: 'user', attributes: ['username', 'id']}]
        }
      ]
    })
    .then(function(versionInstance) {
      return Review.findOne({
        attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'rating']],
        where: {
          reviewable_id: versionInstance.id,
          reviewable: 'version'
        },
        group: ['reviewable_id']
      }).then(function(ratingInstance) {
        if (ratingInstance === null) return versionInstance.toJSON();
        var version = versionInstance.toJSON();
        version.rating = ratingInstance.getDataValue('rating');
        return version;
      });
    })
    .then(function(version) {
      if(version === null) return res.notFound();
      else {
        version.pageTitle = version.package_name + ' v' + version.version;
        return res.ok(version, 'package_version/show.ejs');
      }
    }).catch(function(err) {
      return res.negotiate(err);
    });

  },

  getDownloadStatistics: function(req, res) {
    var packageName = req.param('name');

    _getDownloadStatistics(packageName).then(function(json) {
      if(json.fromCache) {
        res.set('X-Cache', 'hit');
        res.set('Cache-Control', 'max-age=' + 86400);
      } else {
        res.set('X-Cache', 'miss');
        res.set('Cache-Control', 'max-age=' + 86400);
      }
      return res.json(json);
    });
  },

  getPercentile: function(req, res) {
    var packageName = req.param('name');

    var lastMonthPercentiles = ElasticSearchService.lastMonthPercentiles();

    var lastMonthDownload = _getDownloadStatistics(packageName);

    Promise.join(lastMonthPercentiles, lastMonthDownload, function(percentiles, downloads) {
      var total = downloads.total;

      var percentile = _.findLastKey(percentiles, function(p) {
        return total >= p;
      });

      return res.json({total: total, percentile: Math.round(percentile * 100) / 100 });
    });
  }

};

