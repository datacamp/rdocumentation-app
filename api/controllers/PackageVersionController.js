/**
 * PackageVersionController
 *
 * @description :: Server-side logic for managing packageversions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var _ = require('lodash');
var numeral = require('numeral');
var Promise = require('bluebird');
var marked = require('marked');
var frontMatter = require('front-matter');


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
    var jobInfo = req.body.jobInfo;
    var failed = jobInfo.parsingStatus === 'failed';
    var result = Promise.resolve();
    if (!failed) {
      result = PackageVersion.createWithDescriptionFile({ input: req.body });
    }

    var error = null;
    if (jobInfo.error) {
      error = jobInfo.error;
    }

    var addJob = jobInfo ? ParsingJob.upsert({
      package_name: jobInfo.package,
      package_version: jobInfo.version,
      parser_version: jobInfo.parserVersion,
      parsed_at: jobInfo.parsedAt,
      parsing_status: jobInfo.parsingStatus,
      error: error
    }) : Promise.resolve();

    Promise.join(result, addJob, function(value, jobResult) {
      if (value) {
        res.location('/api/packages/' + value.package_name + '/versions/' + value.version);
        var key = 'view_package_version_' + value.package_name + '_' + value.version;
        RedisService.del(key);
        return res.json(value);
      }
      return res.json(undefined);
    }).catch(Sequelize.UniqueConstraintError, function(err) {
      return res.send(409, err.errors);
    }).catch(Sequelize.ValidationError, function(err) {
      return res.send(400, err.errors);
    }).catch(function(err) {
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
  * @apiSuccess {String}   api_uri          Url to the api  this version
  * @apiSuccess {String}   id               Id of this version
  * @apiSuccess {String}   package_name     Name of the package of this version
  * @apiSuccess {String}   version          String describing the version of the package
  * @apiSuccess {String}   title            Title of the version
  * @apiSuccess {String}   description      Description of the package version
  * @apiSuccess {Date}     release_date     Release date of the package version
  * @apiSuccess {String}   license          License of the package version
  * @apiSuccess {String}   url              project url
  * @apiSuccess {String}   copyright        copyright notice include in package
  * @apiSuccess {String}   readmemd         The readme file of the package
  * @apiSuccess {JSON}     sourceJSON       original information included
  * @apiSuccess {String}   maintainer_id    Id of the maintainer of the package version
  * @apiSuccess {Object}   maintainer       Description of the maintainer of this package version
  * @apiSuccess {String}   maintainer.name  Name of the maintainer of the package version
  * @apiSuccess {String}   maintainer.email Email of the maintainer of the package version
  * @apiSuccess {Integer}  maintainer.id    The id given to the maintainer
  * @apiSuccess {String}   maintainer.uri   The url to the page of the maintainer
  * @apiSuccess {String}   maintainer.api_uri The url to the api of the maintainer
  * @apiSuccess {Object[]} collaborators    List of the collaborators and their information.
  * @apiSuccess {String}   collaborators.name   Name of this collaborator of the package version
  * @apiSuccess {String}   collaborators.email  Email of this collaborator of the package version
  * @apiSuccess {Object[]} topics           List of topics (only name and title) (limited to 30)
  * @apiSuccess {JSON}     package          All information as retreived from ´api/packages/:name
  * @apiSuccess {Object[]} vignettes        List of vignettes with their key and url
  * @apiSuccess {String}   type             Always 'package_version'
  */
  findByNameVersion: function(req, res) {
    var packageName = req.param('name');
    var packageVersion = req.param('version');
    var key = 'view_package_version_' + packageName + '_' + packageVersion;
    var user = req.user;

    var packageVersionPromise = RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {
      return PackageVersion.getPackageVersionFromCondition({ package_name: packageName, version: packageVersion });
    });

    var sourcePromise = PackageVersionService.getSourceList(res, packageName, packageVersion);

    // The method above will be cached
    Promise.join(packageVersionPromise, sourcePromise, function(version, sourceList) {
      if (version === null) return res.rstudio_redirect(301, '/packages/' + encodeURIComponent(packageName));
      version.type = 'package_version';
      version.pageTitle = version.package_name + ' package';
      version.hasSource = sourceList.tree.length > 0;
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
          'Enhances',
          'jsonAuthors',
          'tarballUrl']);
      } catch (err) {
        console.log(err.message);
        version.sourceJSON = {};
      }
      if (user) {
        version.package.upvoted = _.includes(_.map(version.package.stars, 'user_id'), user.id);
      } else {
        version.package.upvoted = false;
      }
      return res.ok(version, 'package_version/show.ejs');
    })
    .catch(function(err) {
      console.log(err.message);
      return res.negotiate(err);
    });
  },

  readmePage: function(req, res) {
    var packageName = req.param('name');
    var packageVersion = req.param('version');
    var key = 'view_package_version_' + packageName + '_' + packageVersion;

    RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {
      return PackageVersion.getPackageVersionFromCondition({package_name: packageName, version: packageVersion});
    })
    .then(function(version)  {
      if (version === null) {
        return res.rstudio_redirect(301, '/packages/' + encodeURIComponent(packageName));
      }
      version.pageTitle = version.package_name + ' package Readme';
      return res.ok(version, 'package_version/readme.ejs');
    })
    .catch(function(err) {
      console.log(err.message);
      return res.negotiate(err);
    });
  },

  _getDownloadStatistics: function(res, packageName) {
    var key = 'rdocs_download_stats_' + packageName;

    return RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {
      return DownloadStatistic.getMonthlySplittedDownloads(packageName).then(function(downloads) {
        var total = downloads[0].indirect_downloads + downloads[0].direct_downloads;
        return {total: total, totalStr: numeral(total).format('0,0')};
      });
    });
  },

  /**
  * @api {get} /packages/:name/downloads Total downloads of package
  * @apiName Get package downloads
  * @apiGroup Package
  *
  * @apiSuccess {Integer}  total            Total number of downloads.
  * @apiSuccess {String}   totalStr         Total number of downloads.
  */
  getDownloadStatistics: function(req, res) {
    var packageName = req.param('name');

    sails.controllers.packageversion._getDownloadStatistics(res, packageName).then(function(json) {
      json.fromCache ? res.set('X-Cache', 'hit') : res.set('X-Cache', 'miss');
      res.set('Cache-Control', 'max-age=' + RedisService.DAILY);
      return res.json(json);
    })
    .catch(function(err) {
      return res.negotiate(err);
    });
  },

  /**
  * @api {get} /packages/:name/downloads/splitted Splitted downloads of package
  * @apiName Get splitted package downloads
  * @apiDescription Downloads splitted in direct and indirect ones. A package is downloaded indirectly when a reverse dependency of it is downloaded from the same ip within a minute.
  * @apiGroup Package
  *
  * @apiParam {String}     name                 The name of the package.
  *
  * @apiSuccess {Integer}  directDownloads      Number of direct downloads.
  * @apiSuccess {Integer}  inDirectDownloads    Number of indirect downloads.
  * @apiSuccess {Integer}  total                Total number of downloads.
  * @apiSuccess {String}   directDownloadsStr   Number of direct downloads.
  * @apiSuccess {String}   inDirectDownloadsStr Number of indirect downloads.
  * @apiSuccess {String}   totalStr             Total number of downloads.
  */
  getSplittedDownloadStatistics: function(req, res) {
    var packageName = req.param('name');

    DownloadStatistic.getMonthlySplittedDownloads(packageName).then(function(stats) {
      return res.json({
        directDownloadsStr: numeral(stats[0].direct_downloads).format('0,0'),
        indirectDownloadsStr: numeral(stats[0].indirect_downloads).format('0,0'),
        totalStr: numeral(stats[0].direct_downloads + stats[0].indirect_downloads).format('0,0'),
        directDownloads: stats[0].direct_downloads,
        indirectDownloads: stats[0].indirect_downloads,
        total: stats[0].direct_downloads + stats[0].indirect_downloads
      });
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },

  /**
  * @api {get} /packages/:name/percentile The download percentile of the package.
  * @apiName Get download percentile.
  * @apiGroup Package
  *
  * @apiParam {String}     name                 The name of the package.
  *
  * @apiSuccess {Integer}  percentile           The download percentile of the package.
  * @apiSuccess {Integer}  total                Total number of downloads of the package.
  */
  getPercentile: function(req, res) {
    var packageName = req.param('name');

    var lastMonthPercentiles = Percentile.findAll();

    var lastMonthDownload = sails.controllers.packageversion._getDownloadStatistics(res, packageName);

    Promise.join(lastMonthPercentiles, lastMonthDownload, function(percentilesResponse, downloads) {
      var total = downloads.total;

      var percentiles = _.mapValues(_.keyBy(percentilesResponse, 'percentile'), function(a) { return a.value; });
      var percentile = _.findLastKey(percentiles, function(p) {
        return total >= p;
      });

      return res.json({total: total, percentile: Math.round(percentile * 100) / 100 });
    })
    .catch(function(err) {
      return res.negotiate(err);
    });
  },

  /**
  * @api {get} /packages/:name/downloads/per_day_last_month last month downloads
  * @apiName Get downloads last month
  * @apiDescription Downloads of the package for the last month grouped per day and per class of either direct or indirect downloads.
  * @apiGroup Package
  *
  * @apiParam {String}     name                 The name of the package.
  *
  * @apiSuccess {Date}     timestamp            The day of the downloads.
  * @apiSuccess {String}   key                  Shows whether the downloads were direct or indirect by direct_downloads and indirect_downloads respectively.
  * @apiSuccess {Integer}  count                Number of downloads.
  */
  getLastMonthDownloadPerDay: function(req, res) {
    var packageName = req.param('name');
    DownloadStatistic.lastMonthSplittedDownloadsPerDay(packageName).then(function(data) {
      var serie = data.map(function(d) {
        return [{
          timestamp: d.date,
          key: 'direct_downloads',
          count: d.direct_downloads
        }, {
          timestamp: d.date,
          key: 'indirect_downloads',
          count: d.indirect_downloads
        }];
      });
      serie = [].concat.apply([], serie);
      return res.json(serie);
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },
  
  /**
  * @api {get} /packages/:name/downloads/bioc/years/:year/per_month_last_years Bioc downloads (year)
  * @apiName Get BiocDownloads last year
  * @apiDescription Downloads of the Bioconductor package for the last year grouped per month.
  * @apiGroup Package
  *
  * @apiParam {String}     name                 The name of the package.
  * @apiParam {String}     year                 The year for which the downloads are retreived.
  *
  * @apiSuccess {Date}     timestamp            The month of the downloads.
  * @apiSuccess {String}   key                  Shows description being downloads
  * @apiSuccess {Integer}  count                Number of downloads.
  */
  getBiocPerMonthLastYears: function(req, res) {
    var packageName = req.param('name');
    var years = req.param('years');
    BiocDownloadStatistics.lastYearsSplittedDownloadsPerMonth(packageName, years).then(function(data) {
      var serie = data.map(function(d) {
        return {
          timestamp: d.date,
          key: 'downloads',
          count: d.distinct_ips
        };
      });
      return res.json(serie);
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },

  /**
  * @api {get} /packages/:name/dependencies Dependency graph
  * @apiName Get dependencies of package
  * @apiDescription Get dependencies (2 levels deep) for a specific package formatted as a graph in json.
  * @apiGroup Package
  *
  * @apiParam {String}     name                 The name of the package.
  *
  * @apiSuccess {Object[]} nodes                The package his dependencies and their dependencies.
  * @apiSuccess {String}   nodes.name           The name of the package.
  * @apiSuccess {Integer}  nodes.group          The group to which this package belongs in the graph. The dependency and his dependencies are grouped together. When conflict the second level dependency is grouped with the most popular dependency.
  * @apiSuccess {Object[]} links                The links in the graph represented as a list.
  * @apiSuccess {Integer}  links.source         The dependant package (as number in the nodes list).
  * @apiSuccess {Integer}  links.target         The depending package (as number in the nodes list).
  */
  getDependencyGraph: function(req, res) {
    var rootPackage = req.param('name');

    return Dependency.findIndirectDependencies(rootPackage).then(function(deps) {
      var rootIndex = 0;
      var firstLevel = _.groupBy(deps, 'direct_dependencies');
      var firstLevelPackages = _.keys(firstLevel);
      var nodes = _.map(firstLevelPackages, function(name, i) {
        return {
          name: name,
          group: i + 1
        };
      });

      // prepend the root
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
        var secondLevel = _.map(firstLevel[name], 'indirect_dependencies');
        _.forEach(secondLevel, function(name, i) {
          if (name !== null) {
            if (typeof nodeIndices[name] === 'undefined') {
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
          }
        });
      });

      return res.json({
        nodes: nodes,
        links: links
      });
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },

  /**
  * @api {get} /packages/:name/reversedependencies Reverse dependency graph
  * @apiName Get reversedependencies of package
  * @apiDescription Get reversedependencies (2 levels deep) for a specific package formatted as a graph in json.
  * @apiGroup Package
  *
  * @apiParam {String}     name                 The name of the package.
  *
  * @apiSuccess {Object[]} nodes                The package his reverse dependencies and their reverse dependencies.
  * @apiSuccess {String}   nodes.name           The name of the package.
  * @apiSuccess {Integer}  nodes.group          The group to which this package belongs in the graph. The reverse dependency and his reverse dependencies are grouped together. When conflict the second level reverse dependency is grouped with the most popular reverse dependency.
  * @apiSuccess {Object[]} links                The links in the graph represented as a list.
  * @apiSuccess {Integer}  links.source         The depending package (as number in the nodes list).
  * @apiSuccess {Integer}  links.target         The dependant package (as number in the nodes list).
  */
  getReverseDependencyGraph: function(req, res) {
    var rootPackage = req.param('name');

    return Dependency.findIndirectReverseDependencies(rootPackage).then(function(deps) {
      var rootIndex = 0;
      var firstLevel = _.groupBy(deps, 'direct_reverse_dependencies');
      var firstLevelPackages = _.keys(firstLevel);
      var nodes = _.map(firstLevelPackages, function(name, i) {
        return {
          name: name,
          group: i + 1
        };
      });

      // prepend the root
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
          if (name != null) {
            if (typeof nodeIndices[name] === 'undefined') {
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
          }
        });
      });

      return res.json({
        nodes: nodes,
        links: links
      });
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },
  
  /**
  * @api {get} /packages/:name/downloads/days/:days/per_day last days downloads per day
  * @apiName Get downloads last day per day
  * @apiDescription Downloads of the package for the last month grouped per day.
  * @apiGroup Package
  *
  * @apiParam {String}     name                 The name of the package.
  *
  * @apiSuccess {Date}     timestamp            The day of the downloads.
  * @apiSuccess {String}   key                  Shows whether the downloads were direct, indirect or total by direct_downloads, indirect_downloads and total_downloads respectively.
  * @apiSuccess {Integer}  count                Number of downloads.
  */
  getDownloadPerDayLastDays: function(req, res) {
    var packageName = req.param('name');
    var days = parseInt(req.param('days'), 10);
    if (days > 30) {
      return ElasticSearchService.lastDaysPerDay(packageName, days).then(function(data) {
        var serie = data.map(function(d) {
          return {
            timestamp: d.key_as_string,
            key: 'total_downloads',
            count: d.doc_count
          };
        });
        return res.json(serie);
      }).catch(function(err) {
        return res.negotiate(err);
      });
    }
    return DownloadStatistic.lastDaysSplittedDownloadsPerDay(packageName, days).then(function(data) {
      var serie = data.map(function(d) {
        return [{
          timestamp: d.date,
          key: 'direct_downloads',
          count: d.direct_downloads
        }, {
          timestamp: d.date,
          key: 'indirect_downloads',
          count: d.indirect_downloads
        }];
      });
      serie = [].concat.apply([], serie);
      return res.json(serie);
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },

  getVignette: function(req, res) {
    var package_name = req.param('name');
    var version = req.param('version');
    var vignette = req.param('key');

    var key = 'rdocs_vignette_' + package_name + '_' + version + '_' + vignette;

    RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {
      var s3Key = 'rpackages/unarchived/' + package_name + '/' + version + '/' + 'vignettes/' + vignette;

      return s3Service.getObject(s3Key)
      .then(function(file) {
        var title = vignette;

        // Replace things like {r setup, include = FALSE} with {r}
        // Marked doesn't recognise those as the start of a code block.
        file = file.replace(/{r.*}/gi, '{r}');

        // Split yaml part and markdown part
        var content = frontMatter(file);
        if (content.attributes.title !== undefined) {
          title = content.attributes.title;
        }

        // Parse markdown
        file = marked(content.body, {renderer: Utils.markdown_renderer(true)});

        return { file: file, title: title };
      });
    }).then(function(response) {
      return res.ok(response, 'package_version/vignette.ejs')
    })
    .catch(function(err) {
      console.log(err.message);
      return res.negotiate(err);
    });
  },

  sourcePage: function(req, res) {
    var package_name = req.param('name');
    var version = req.param('version');
    var response = {
      package_name: package_name,
      version: version,
      uri: '/packages/' + package_name + '/versions/' + version
    };
    res.ok(response, 'package_version/source.ejs');
  },

  getSourceTree: function(req, res) {
    var package_name = req.param('name');
    var version = req.param('version');

    PackageVersionService.getSourceList(res, package_name, version)
    .then(function(response) {
      res.json(response);
    })
    .catch(function(err) {
      console.log(err.message);
      return res.negotiate(err);
    });
  },

  getSource: function(req, res) {
    var package_name = req.param('name');
    var version = req.param('version');
    var filename = req.param('filename');

    var key = 'rdocs_source_' + package_name + '_' + version + '_' + filename;

    RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {
      var prefix = 'rpackages/unarchived/' + package_name + '/' + version + '/R/' + filename;
      return s3Service.getObject(prefix)
      .then(function(source) {
        return { source: source };
      });
    }).then(function(response) {
      res.json(response);
    })
    .catch(function(err) {
      console.log(err.message);
      return res.negotiate(err);
    });
  }

};
