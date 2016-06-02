/**
 * PackageController
 *
 * @description :: Server-side logic for managing packages
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {


  /**
  * @api {get} /packages/:name Request Package Information
  * @apiName Get Package
  * @apiGroup Package
  *
  * @apiParam {String} name Name of the package
  *
  * @apiUse Timestamps
  * @apiSuccess {String}   name                   Package name
  * @apiSuccess {String}   latest_version_id      Last version (more recent) of this package
  * @apiSuccess {String}   url                    Url to `self`
  * @apiSuccess {Object[]} versions               List of versions of this package
  * @apiSuccess {String}   versions.url           Url to this version
  * @apiSuccess {String}   versions.package_url   Url to the package of this version
  * @apiSuccess {String}   versions.id            Id of this version
  * @apiSuccess {String}   versions.package_name  Name of the package of this version
  * @apiSuccess {String}   versions.version       String describing the version of the package
  * @apiSuccess {String}   versions.title         Title of the version
  * @apiSuccess {String}   versions.description   Description of the package version
  * @apiSuccess {Date}     versions.release_date  Release date of the package version
  * @apiSuccess {String}   versions.license       License of the package version
  * @apiSuccess {String}   versions.maintainer_id Id of the maintainer of the package version
  */

  findByName: function(req, res) {
    var packageName = req.param('name');

    Package.findOne({
      where: {
        name: packageName,
      },
      include: [
        { model: PackageVersion, as: 'versions' },
      ]
    }).then(function(package) {
      if(package === null) return res.notFound();
      else return res.json(package);
    }).catch(function(err) {
      return res.negotiate(err);
    });

  }

};

