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

  /**
  * @api {get} /packages List all packages
  * @apiName Get Packages
  * @apiGroup Package
  * @apiDescription Return an array of package object containing listed attributes
  *
  * @apiParam {String} page    the page number to use when limiting records to send back using perPage (useful for pagination)
  * @apiParam {String} perPage the maximum number of records to send back (useful for pagination)
  * @apiParam {String} sort    the order of returned records, e.g. `name ASC` or `name DESC`
  *
  * @apiSuccess {String}   name                   Package name
  * @apiSuccess {String}   latest_version_id      Last version (more recent) of this package
  * @apiSuccess {String}   url                    Url to `self`
  * @apiUse Timestamps
  */


  /**
  * @api {post} /packages Create a new package
  * @apiName Create Package
  * @apiGroup Package
  * @apiDescription Return the newly created resource
  * Note: The Location header contains a url to the newly created resource
  *
  * @apiParam {String} name                The name of the package to be created
  * @apiParam {String} [latest_version_id] The id of the latest package version
  *
  * @apiSuccess {String}   name                   Package name
  * @apiSuccess {String}   latest_version_id      Last version (more recent) of this package
  * @apiSuccess {String}   url                    Url to `self`
  * @apiUse Timestamps
  */


};

