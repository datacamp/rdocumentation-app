/**
 * PackageVersionController
 *
 * @description :: Server-side logic for managing packageversions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  /**
  * @api {post} /versions Create a new PackageVersion
  * @apiName Create PackageVersion
  * @apiGroup PackageVersion
  *
  * @apiDescription Create a new PackageVersion from a parsed DESCRIPTION file, for more information
  * about the fields and their semantic, visit https://cran.r-project.org/doc/manuals/r-release/R-exts.html#The-DESCRIPTION-file
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

