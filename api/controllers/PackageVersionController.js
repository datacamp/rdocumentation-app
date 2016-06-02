/**
 * PackageVersionController
 *
 * @description :: Server-side logic for managing packageversions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {


  postDescription: function(req, res) {
    var result = PackageVersion.createWithDescriptionFile({input: req.body});
    result.then(function(value) {
      //console.log(value.dependencies);
      res.json(value);
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
  * @apiSuccess {String}   url              Url to this package version
  * @apiSuccess {String}   package_url      Url to the package of this version
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
        { model: Collaborator, as: 'maintainer', attributes: ['name', 'email'] },
        { model: Collaborator, as: 'authors', attributes: ['name', 'email'] }
      ]
    }).then(function(version) {
      if(version === null) return res.notFound();
      else return res.json(version);
    }).catch(function(err) {
      return res.negotiate(err);
    });

  }

};

