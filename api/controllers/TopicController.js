/**
 * TopicController
 *
 * @description :: Server-side logic for managing topics
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');
var _ = require('lodash');


module.exports = {
  /**
  * @api {post} /packages/:name/versions/:version/topics Create a new topic
  * @apiName Create Topic
  * @apiGroup Topic
  *
  * @apiDescription Create a new Topic from a parsed Rd file, for more information
  * about the fields and their semantic, visit https://developer.r-project.org/parseRd.pdf
  * Note: the Location header of the response is set to the url pointing to the newly created resource
  *
  * @apiParam {String}   name                 `Name` of the topic.
  * @apiParam {String}   title                `Title` of the topic
  * @apiParam {String}   [description]        `Description` section of the topic
  * @apiParam {String}   [usage]              `Usage` section of the topic
  * @apiParam {String}   [details]            `Details` section of the topic
  * @apiParam {String}   [value]              `Value` section of the topic
  * @apiParam {String}   [references]         `References` section of the topic
  * @apiParam {String}   [note]               `Note` section of the topic
  * @apiParam {String}   [seealso]            `See Also` section of the topic
  * @apiParam {String}   [examples]           `Examples` section of the topic
  * @apiParam {String}   [author]              `Author` section about this topic
  * @apiParam {Object[]} [arguments]           List of topic arguments (optional)
  * @apiParam {String}   arguments.name        Name of the argument
  * @apiParam {String}   arguments.description Description of the argument
  * @apiParam {String[]} [keywords]            List of topic keywords, either a array of string or a comma separated list, or a combination of both
  * @apiParam {String[]} [alias]               List of topic aliases, either a array of string or a comma separated list, or a combination of both
  * @apiParam {Object}   [sectionName]         One or more 'section attributes', the key will be the name of the section, and the value will be the description (must be a string)

  @apiError 400 ValidationError
  @apiError 404 The specified package version does not exists
  @apiError 409 ConflictError A topic version with the same name already exists within that package version.

  */
  postRdFile: function(req, res) {
    var packageName = req.param('name');
    var packageVersion = req.param('version');
    var result = Topic.createWithRdFile({input: req.body, packageName: packageName, packageVersion: packageVersion});
    result.then(function(value) {
      res.json(value);
    })
    .catch(Sequelize.UniqueConstraintError, function (err) {
      return res.send(409, err);
    }).catch(Sequelize.ValidationError, function (err) {
      return res.send(400, err);
    }).catch(function(err){
        return res.negotiate(err);
    });
  },



  /**
  * @api {get} /packages/:name/versions/:version/topics/:topic Request Topic information
  * @apiName Get Topic
  * @apiGroup Topic
  *
  * @apiParam {String} name Name of the package
  * @apiParam {String} version Version of the package
  * @apiParam {String} topic Name of the topic to get

  *
  * @apiUse Timestamps
  * @apiSuccess {Number}   id                            id of this topic
  * @apiSuccess {Number}   package_version_id            id of the PackageVersion
  * @apiSuccess {Number}   uri                           Uri to `self`
  * @apiSuccess {String}   name                          Name of this topic
  * @apiSuccess {String}   title                         Title of this topic
  * @apiSuccess {String}   description                   `Description` section of this topic
  * @apiSuccess {String}   usage                         `Usage` section of this topic
  * @apiSuccess {String}   details                       `Details` section of this topic
  * @apiSuccess {String}   value                         `Value` section of this topic
  * @apiSuccess {String}   references                    `References` section of this topic
  * @apiSuccess {String}   author                        `Author` section about this topic
  * @apiSuccess {String}   note                          `Note` section about this topic
  * @apiSuccess {String}   seealso                       `See also` section about this topic
  * @apiSuccess {String}   examples                      `Examples` section about this topic
  * @apiSuccess {Object[]} arguments                     List of topic arguments
  * @apiSuccess {String}   arguments.name                Name of the argument
  * @apiSuccess {String}   arguments.description         Description of the argument
  * @apiSuccess {Object[]} keywords                      List of topic keywords
  * @apiSuccess {String}   keywords.name                 Name of the keyword
  * @apiSuccess {Object[]} aliases                       List of topic aliases
  * @apiSuccess {String}   aliases.name                  Name of the alias
  * @apiSuccess {Object[]} section                       List of topic custom sections
  * @apiSuccess {String}   section.name                  Title of the section
  * @apiSuccess {String}   section.description           Description of the section
  * @apiSuccess {Object}   package_version               Informations about the version of the package
  * @apiSuccess {String}   package_version.url           Url to this version
  * @apiSuccess {String}   package_version.package_url   Url to the package of this version
  * @apiSuccess {String}   package_version.id            Id of this version
  * @apiSuccess {String}   package_version.package_name  Name of the package of this version
  * @apiSuccess {String}   package_version.version       String describing the version of the package
  * @apiSuccess {String}   package_version.title         Title of the version
  * @apiSuccess {String}   package_version.description   Description of the package version
  * @apiSuccess {Date}     package_version.release_date  Release date of the package version
  * @apiSuccess {String}   package_version.license       License of the package version
  * @apiSuccess {String}   package_version.maintainer_id Id of the maintainer of the package version
  */

  findByName: function(req, res) {
    var packageName = req.param('name');
    var packageVersion = req.param('version');
    var topic = req.param('topic');


    Topic.findOnePopulated({name: topic}, {
      include: [{
        model: PackageVersion,
        as: 'package_version',
        where: { package_name: packageName, version: packageVersion }
      }]
    }).then(function(topic) {
      if(topic === null) return res.notFound();
      else return TopicService.computeLinks('/link/', topic)
        .then(function(topic) {
          return res.ok(topic, 'topic/show.ejs');
        });
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },

   /**
  * @api {get} /topics/:id Request Topic information
  * @apiName Get Topic
  * @apiGroup Topic
  *
  * @apiParam {String} id Id of the package

  *
  * @apiUse Timestamps
  * @apiSuccess {Number}   id                            id of this topic
  * @apiSuccess {Number}   uri                           Uri to `self`
  * @apiSuccess {Number}   package_version_id            id of the PackageVersion
  * @apiSuccess {String}   name                          Name of this topic
  * @apiSuccess {String}   title                         Title of this topic
  * @apiSuccess {String}   description                   `Description` section of this topic
  * @apiSuccess {String}   usage                         `Usage` section of this topic
  * @apiSuccess {String}   details                       `Details` section of this topic
  * @apiSuccess {String}   value                         `Value` section of this topic
  * @apiSuccess {String}   references                    `References` section of this topic
  * @apiSuccess {String}   author                        `Author` section about this topic
  * @apiSuccess {String}   note                          `Note` section about this topic
  * @apiSuccess {String}   seealso                       `See also` section about this topic
  * @apiSuccess {String}   examples                      `Examples` section about this topic
  * @apiSuccess {Object[]} arguments                     List of topic arguments
  * @apiSuccess {String}   arguments.name                Name of the argument
  * @apiSuccess {String}   arguments.description         Description of the argument
  * @apiSuccess {Object[]} keywords                      List of topic keywords
  * @apiSuccess {String}   keywords.name                 Name of the keyword
  * @apiSuccess {Object[]} aliases                       List of topic aliases
  * @apiSuccess {String}   aliases.name                  Name of the alias
  * @apiSuccess {Object[]} section                       List of topic custom sections
  * @apiSuccess {String}   section.name                  Title of the section
  * @apiSuccess {String}   section.description           Description of the section
  * @apiSuccess {Object}   package_version               Informations about the version of the package
  * @apiSuccess {String}   package_version.url           Url to this version
  * @apiSuccess {String}   package_version.package_url   Url to the package of this version
  * @apiSuccess {String}   package_version.id            Id of this version
  * @apiSuccess {String}   package_version.package_name  Name of the package of this version
  * @apiSuccess {String}   package_version.version       String describing the version of the package
  * @apiSuccess {String}   package_version.title         Title of the version
  * @apiSuccess {String}   package_version.description   Description of the package version
  * @apiSuccess {Date}     package_version.release_date  Release date of the package version
  * @apiSuccess {String}   package_version.license       License of the package version
  * @apiSuccess {String}   package_version.maintainer_id Id of the maintainer of the package version
  */

  findById: function(req, res) {
    var id = req.param('id');

    Topic.findOnePopulated({id: id}, {
      include: [{
        model: PackageVersion,
        as: 'package_version',
        attributes: ['package_name', 'version']
      }]
    }).then(function(topic) {
      if(topic === null) return res.notFound();
      else {
        return TopicService.computeLinks('/link/', topic)
          .then(function(topic) {
            return res.ok(topic, 'topic/show.ejs');
          });
      }
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },

  /**
  * @api {get} /link/:alias?[package=][version=] Redirect to a topic
  * @apiName Redirect to topic
  * @apiGroup Topic
  *
  * @apiParam {String} alias Alias to search for
  * @apiParam {String} package Package name from which we refer to this topic
  * @apiParam {String} version Package version (string) from which we refer to this topic
  */
  findByAlias: function(req, res) {
    var fromPackageName = req.param('package');
    var fromPackageVersion = req.param('version');
    var alias = req.param('alias');
    var toPackage = req.param('to');
    var fromPackage = { package_name: fromPackageName, version: fromPackageVersion };
    var packageCriteria = toPackage ? {package_name: toPackage} : fromPackage;

    Topic.findOne({
      include: [{
        model: Alias,
        as: 'aliases',
        attributes: ['name'],
        where: {
          name: alias
        }
      },
      {
        model: PackageVersion,
        as: 'package_version',
        where: packageCriteria
      }]
    }).then(function(topic) {
      if(topic !== null) return res.redirect(topic.uri);
      else {
        Alias.findByNameInLatestVersions(alias).then(function(aliases) {
          if (aliases.length === 0) return res.notFound(); //no match found anywhere, 404
          if (aliases.length === 1) { //if there is only 1 match, redirect to this one
            return res.redirect(aliases[0].topic.uri);
          } else {
            var searchInDependencies = function(packages, level) {
              if (level >= 3) return Promise.reject('too deep');
              var depsPromises = _.map(packages, function(package_name) {
                return Dependency.findByDependant(package_name).then(function(deps) {
                  var depsNameArray = _.map(deps, 'dependency_name');
                  var alias = _.find(aliases, function(alias) {
                    return _.includes(depsNameArray, alias.topic.package_version.package_name);
                  });
                  if (alias) {
                    console.info("link found in " + alias.topic.package_version.package_name);
                    return alias.topic.uri;
                  } else throw {dependencies: depsNameArray};
                });
              });

              return Promise.any(depsPromises).catch(Promise.AggregateError, function(errors) {
                //not found in this level of dependency, search in next level
                var deps = _.reduce(errors, function(acc, val) { // collect thrown dependencies
                  return acc.concat(val.dependencies);
                }, []);
                return searchInDependencies(deps, level + 1); // recurse to next level of dependency
              });


            };
            searchInDependencies([fromPackage.package_name], 0).then(function(uri) {
              return res.redirect(uri);
            }).catch(function(err) {
              console.info(err);
              console.info("link not found, go to: " + aliases[0].topic.uri);
              return res.redirect(aliases[0].topic.uri); // no match in dependencies, just redirect to first one
            });

          }
        });
      }
    }).catch(function(err) {
      return res.negotiate(err);
    });



  }

};

