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
  * @apiParam {String[]} [aliases]             List of topic aliases, either a array of string or a comma separated list, or a combination of both
  * @apiParam {Object[]} [sections]            List of custom sections
  * @apiParam {String}   sections.name         Name of the section
  * @apiParam {String}   sections.description  Description of the section
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
    var key = 'view_topic_' + packageName + '_' + packageVersion + '_' + topic;
    if (topic.endsWith('.html')) topic = topic.replace('.html', '');


    RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {
      var canonicalPromise = Topic.findByNameInPackage(packageName, topic).then(function(t) {
        if(t === null || t === undefined) return null;
        return t.uri;
      });

      var examplesPromise = Example.findPackageExamples(packageName, topic);

      var topicPromise = Topic.findOnePopulated({name: topic}, {
        include: [{
          model: PackageVersion,
          as: 'package_version',
          where: { package_name: packageName, version: packageVersion },
          include: [{ model: Package, as: 'package', attributes: ['name', 'latest_version_id', 'type_id' ]},
          { model: Collaborator, as: 'maintainer'}]
        },]
      }).then(function(topicInstance) {
        if(topicInstance === null) {
          return Topic.findByAliasInPackage(packageName, topic, packageVersion).then(function(topicInstance) {
            if(!topicInstance) return null;
            else return { redirect_uri: topicInstance.uri };
          });
        }
        else return topicInstance;
      }).then(function(topicInstance) {
        if(topicInstance === null) return null;
        else if(topicInstance.redirect_uri) return topicInstance;
        else return TopicService.processHrefs(topicInstance)
          .then(function(topic) {
            topic.pageTitle = topic.name + ' function';
            return topic;
          });
      });

      var dclPromise = PackageService.isDCLSupported(packageName, packageVersion)

      return Promise.join(topicPromise, examplesPromise, canonicalPromise, dclPromise, function(topicJSON, examples, canonicalLink, dcl) {
        if(topicJSON === null) return null;
        topicJSON.canonicalLink = canonicalLink;
        var userExamples = examples.sort(function (example1, example2) {
          const compare = PackageService.compareVersions('desc');
          const compareValue = compare(example1.topic.package_version.version, example2.topic.package_version.version);
          if (compareValue === 0) return example2.created_at.getTime() - example1.created_at.getTime();
          else return compareValue;
        });
        topicJSON.dcl = dcl || (topicJSON.package_version && topicJSON.package_version.package.type_id === 4); //in the list or in base r
        topicJSON.user_examples = userExamples;
        return topicJSON;
      });
    }).then(function(topicJSON) {
      if(topicJSON === null) return res.rstudio_redirect(301, '/packages/' + encodeURIComponent(packageName) + '/versions/' + encodeURIComponent(packageVersion));
      else if(topicJSON.redirect_uri) return res.rstudio_redirect(301, topicJSON.redirect_uri);
      return res.ok(topicJSON, 'topic/show.ejs');
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
  * @apiSuccess {String}   package_version.uri           Url to this version
  * @apiSuccess {String}   package_version.api_uri       Url to the api of this version.
  * @apiSuccess {String}   package_version.package_name  Name of the package of this version
  * @apiSuccess {String}   package_version.version       String describing the version of the package
  */

  findById: function(req, res) {
    var id = req.param('id');
    var key = 'view_topic_' + id;


    RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {


      return Topic.findOnePopulated({id: id}, {
      }).then(function(topicInstance) {
        if(topicInstance === null) return null;
        else {
          return Topic.findByNameInPackage(topicInstance.package_version.package_name, topicInstance.name).then(function(t) {
            return TopicService.processHrefs(topicInstance)
              .then(function(topic) {
                topic.pageTitle = topic.name + ' function';
                topic.canonicalLink = t.uri;
                return topic;
              });
          });
        }

      });

    }).then(function(topicJSON) {
      if(topicJSON === null) return res.notFound();
      return res.rstudio_redirect(301, topicJSON.uri);
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

    if(toPackage) {
      var splitted = toPackage.split(':');

      if(splitted.length === 2) {
        toPackage = splitted[0];
        alias = splitted[1];
      }
    }

    var fromPackage = { package_name: fromPackageName, version: fromPackageVersion };
    var packageCriteria = toPackage ? {package_name: toPackage} : fromPackage;

    RedisService.getJSONFromCache(req.url, res, RedisService.WEEKLY, function() {

      return Topic.findOne({
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
        if(topic !== null) return {uri: topic.uri};
        else {
          return Alias.findByNameInLatestVersions(alias).then(function(aliases) {
            if (aliases.length === 0) return null; //no match found anywhere, 404
            if (aliases.length === 1) { //if there is only 1 match, redirect to this one
              return {uri: aliases[0].topic.uri};
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
              return searchInDependencies([fromPackage.package_name], 0).then(function(uri) {
                return {uri: uri};
              }).catch(function(err) {
                console.error(err);
                return { uri: aliases[0].topic.uri}; // no match in dependencies, just redirect to first one
              });

            }
          });
        }
      });

    }).then(function(json) {
      if(json === null) {
        return res.rstudio_redirect(302,'/packages/' + fromPackageName + '/versions/' + fromPackageVersion);
      } else {
        return res.rstudio_redirect(301,json.uri);
      }
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },
/**
  * @api {get} /topics/:id/rating Topic rating
  * @apiName The rating of a topic
  * @apiGroup Topic
  *
  * @apiParam   {Integer}   id        The id of the topic.
  *
  * @apiSuccess {Integer}   rating    The rating of the topic.
  */
  rating: function(req, res) {
    var topicId = req.param('id'),
        key = 'topic_rating_' + topicId;
    var scope = sails.models.topic.associations.reviews.scope;

    RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {
      return Review.findOne({
        attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'rating']],
        where: {
          reviewable_id: topicId,
          reviewable: scope.reviewable
        },
      });
    })
    // The method above will be cached
    .then(function(json){
      return res.ok({rating: json.rating});
    })
    .catch(function(err) {
      return res.negotiate(err);
    });
  },
/**
  * @api {get} /packages/:name/topics/:topic Request Topic information
  * @apiDescription The topic is searched within the different versions and is redirected when found.
  * @apiName Get Topic
  * @apiGroup Topic
  *
  * @apiParam {String} name Name of the package
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
  redirect: function(req,res) {
    var packageName = req.param('name'),
        functionName = req.param('function');
    if (functionName.endsWith('.html')) functionName = functionName.replace('.html', '');

    Topic.findByNameInPackage(packageName, functionName).then(function(topicInstance) {
      if(topicInstance === null || topicInstance === undefined) {
        return Topic.findByAliasInPackage(packageName, functionName);
      } else {
        return topicInstance;
      }
    }).then(function(topicInstance) {
      if(!topicInstance) {
        return res.rstudio_redirect(301, '/packages/' + encodeURIComponent(packageName));
      } else {
        var prefix = req.path.startsWith('/api/') ? '/api' : '';
        return res.rstudio_redirect(301, prefix + topicInstance.uri);
      }
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },


  /**
  * @api {get} api/light/packages/:name/topics/:function Request Topic Information for Rdocs light
  * @apiName Get Topic in package (latest version which contains the topic)
  * @apiGroup Light
  *
  * @apiParam {String} Name of the package
  * @apiParam {String} Name of the topic
  *
  * @apiSuccess {String}   name                          Name of this topic
  * @apiSuccess {String}   title                         Title of the topic
  * @apiSuccess {String}   description                   Description of the topic
  * @apiSuccess {String}   url                           The Url to `self`
  * @apiSuccess {Object}   package_version               Informations about the version of the package
  * @apiSuccess {String}   package_version.url           Url to this version
  * @apiSuccess {String}   package_version.package_name  Name of the package of this version
  * @apiSuccess {String}   package_version.version       String describing the version of the package
  */
  lightTopicSearch: function(req,res) {
    var packageName = req.param('name'),
        topic_name = req.param('function');

    var key = 'light_' + packageName + '_' + topic_name;
    if (topic_name.endsWith('.html')) topic_name = topic_name.replace('.html', '');

    RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {
      return Topic.findAll({
        where: {name: topic_name},
        include: [{
          model: PackageVersion,
          as: 'package_version',
          where: { package_name: packageName },
          include: [
            { model: Package, as: 'package', attributes: ['name', 'latest_version_id', 'type_id' ]},
          ]
        },
        {model: Argument, as: 'arguments', attributes: ['name', 'description', 'topic_id'], separate:true },
        {model: Section, as: 'sections', attributes: ['name', 'description', 'topic_id'], separate:true },
        {model: Tag, as: 'keywords', attributes: ['name']},
        {model: Alias, as: 'aliases', attributes: ['name', 'topic_id'], separate: true },
        ]
      }).then(function(topicInstances) {
        if(topicInstances === null) {
          return Topic.findByAliasInPackage(packageName, topic).then(function(topicInstances) {
            if(!topicInstances) return null;
            else return topicInstances.sort(PackageService.compareVersions('desc', function(topic) {
            return topic.package_version.version }))[0];
          });
        }
        else return topicInstances.sort(PackageService.compareVersions('desc', function(topic) {
            return topic.package_version.version }))[0];
      }).then(function(topic){
        if(topic === undefined || topic === null) return null;
        return TopicService.processHrefs(topic, false);
      }).then(function(topic) {
        var part = {};
        if(topic !== null){
          part.name = topic.name;
          part.title = topic.title;
          part.description = topic.description;
          part.url = 'https:' + process.env.BASE_URL + topic.package_version.uri + '/topics/' + topic_name;
          part.package_version = {
            package_name: topic.package_version.package_name,
            version: topic.package_version.version,
            url: 'https:' + process.env.BASE_URL + topic.package_version.uri,
          };

          part.anchors = [];
          TopicService.addAnchorItem(part.anchors, topic.keywords, "keywords", "kywrds");
          TopicService.addAnchorItem(part.anchors, topic.usage, "usage", "usg");
          TopicService.addAnchorItem(part.anchors, topic.arguments, "arguments", "argmnts");
          TopicService.addAnchorItem(part.anchors, topic.details, "details", "dtls");
          TopicService.addAnchorItem(part.anchors, topic.value, "value", "vl");
          TopicService.addAnchorItem(part.anchors, topic.note, "note", "nt");
          TopicService.addAnchorItem(part.anchors, topic.sections, "sections", "sctns");
          TopicService.addAnchorItem(part.anchors, topic.references, "references", "rfrncs");
          TopicService.addAnchorItem(part.anchors, topic.seealso, "see also", "sls");
          // TopicService.addAnchorItem(part.anchors, topic.aliases, "aliases", "alss");
          TopicService.addAnchorItem(part.anchors, topic.examples, "examples", "exmpls");

        }
        return part;
      });
    })
    .then(function(topic){
      return res.json(topic);
    })
    .catch(function(err) {
      return res.negotiate(err);
    });
  },

  figure: function(req, res) {
    const packageName = req.param('package');
    const version = req.param('version');
    const path = req.param('path');
    res.redirect(302, `https://s3.amazonaws.com/assets.rdocumentation.org/rpackages/unarchived/${packageName}/${version}/figures/${path}`);
  },

};

