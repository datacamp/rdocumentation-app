/**
 * TopicController
 *
 * @description :: Server-side logic for managing topics
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  postRdFile: function(req, res) {
    var packageName = req.param('name');
    var packageVersion = req.param('version');
    var result = Topic.createWithRdFile({input: req.body, packageName: packageName, packageVersion: packageVersion});
    result.then(function(value) {
      res.json(value);
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
  * @apiSuccess {String}   name                          Name of this topic
  * @apiSuccess {String}   title                         Title of this topic
  * @apiSuccess {String}   description                   `Description` section of this topic
  * @apiSuccess {String}   usage                         `Usage` section of this topic
  * @apiSuccess {String}   details                       `Details` section of this topic
  * @apiSuccess {String}   value                         `Value` section of this topic
  * @apiSuccess {String}   references                    `References` section of this topic
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
      else return res.json(topic);
    }).catch(function(err) {
      return res.negotiate(err);
    });
  }

};

