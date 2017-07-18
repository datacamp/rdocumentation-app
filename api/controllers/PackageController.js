/**
 * PackageController
 *
 * @description :: Server-side logic for managing packages
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');

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
  * @apiSuccess {Integer}  latest_version_id      Last version (more recent) of this package
  * @apiSuccess {String}   uri                    Url to `self`
  * @apiSuccess {String}   api_uri                Url to the api endpoint of `self`
  * @apiSuccess {Integer}  type_id                Represents the repository from which the package is retrieved (1 for cran, 2 for bioconductor and 3 for github).
  * @apiSuccess {String}   created_at             The moment at which the record was created.
  * @apiSuccess {String}   updated_at             The moment at which the most recent update to the record occured.
  * @apiSuccess {Object[]} versions               List of versions of this package
  * @apiSuccess {String}   versions.uri           Url to this version
  * @apiSuccess {String}   versions.api_uri       Url to the api endpoint of this version
  * @apiSuccess {Integer}  versions.id            Id of this version
  * @apiSuccess {String}   versions.package_name  Name of the package of this version
  * @apiSuccess {String}   versions.version       String describing the version of the package
  * @apiSuccess {String}   versions.title         Title of the version
  * @apiSuccess {String}   versions.description   Description of the package version
  * @apiSuccess {Date}     versions.release_date  Release date of the package version
  * @apiSuccess {String}   versions.license       License of the package version
  * @apiSuccess {String}   versions.url           Url to official site of package
  * @apiSuccess {String}   versions.copyright     Copyright notice included in package
  * @apiSuccess {String}   versions.readmemd      Readme included in the package
  * @apiSuccess {String}   versions.sourceJSON    The sourceJSON containing the data from which the package is parsed.
  * @apiSuccess {Date}     created_at             The moment at which the record was created.
  * @apiSuccess {Date}     updated_at             The moment at which the most recent update to the record occured.
  * @apiSuccess {Integer}  versions.maintainer_id Id of the maintainer of the package version
  */

  findByName: function(req, res) {
    var packageName = req.param('name');

    Package.findOne({
      where: {
        name: packageName,
      },
      include: [
        { model: PackageVersion, as: 'versions' },
      ],
    }).then(function(_package) {
      if(_package === null) {
        return res.rstudio_redirect(301, '/search?q=' + encodeURIComponent(packageName));
        //there seems to be a problem with redirected requests if text/html is set as contentype for the ajax request, so I just
        //adapt this so Rstudio still gets the html
      } else if(req.wantsJSON &&!req.param("viewer_pane")==1) {
        return res.json(_package);
      } else {
        if (_package.versions.length === 0)
          return Package.findOne({
            where: {name: packageName},
            include: [{ model: PackageVersion, attributes: ['package_name', 'version', 'id'], as: 'reverse_dependencies'}]
          }).then(function(packageInstance) {
            if(packageInstance === null) return res.notFound();
            var _package = packageInstance.toJSON();
            _package.pageTitle = packageInstance.name;
            return res.ok(_package, 'package/show.ejs');
          });
        else return res.rstudio_redirect(301, _package.versions.sort(PackageService.compareVersions('desc', 'version'))[0].uri);
      }
    }).catch(function(err) {
      return res.negotiate(err);
    });

  },

  /**
  * @api {get} /packages List all packages
  * @apiName Get Packages
  * @apiGroup Package
  * @apiDescription Return an array of package object containing listed attributes
  *
  * @apiParam {String} limit    the number to use when limiting records to send back (useful for pagination)
  * @apiParam {String} skip     the number of records to skip when limiting (useful for pagination)
  * @apiParam {String} sort     the order of returned records, e.g. `name ASC` or `name DESC`
  * @apiParam {String} criteria Limits packages to ones matching the given criteria. Criteria on the following columns are supported: `name`, `created_at`, `updated_at`, `latest_version_id` and `type_id` (being the number given to the repository in which the package is 1 for cran, 2 for bioconductor and 3 for github).
  * (e.g.: If you only want packages from github the argument type_id=3 can be passed.)
  *
  * @apiSuccess {String}   name                   Package name
  * @apiSuccess {Integer}  latest_version_id      Id of the last version (more recent) of this package
  * @apiSuccess {String}   uri                    Url to `self`
  * @apiSuccess {String}   api_uri                Url to the api endpoint of `self`
  * @apiSuccess {String}   type_id                Represents the repository from which the package is retrieved (1 for cran, 2 for bioconductor and 3 for github).
  * @apiSuccess {Date}     created_at             The moment at which the record was created.
  * @apiSuccess {Date}     updated_at             The moment at which the most recent update to the record occured.
  * @apiUse Timestamps
  */
  find: function(req, res) {
    var limit = Utils.parseLimit(req),
      offset = Utils.parseSkip(req),
      sort = Utils.parseSort(req),
      criteria = Utils.parseCriteria(req);

    Package.findAll({
      where: criteria,
      limit: limit,
      offset: offset,
      order: sort,
      include: []
    }).then(function(packages) {
      return res.json(packages);
    }).catch(function(err) {
      return res.negotiate(err);
    });

  },

  toggleStar: function(req, res) {
    var packageName = req.param('name');
    var user = req.user;

    RedisService.delPrefix("view_package_version_"+packageName);
    Package.findOne({
      where: {name: packageName},
      include: [
        { model: TaskView, as: 'inViews', attributes:['name'] }
      ]
    }).then(function(_package){
      var views = _package.inViews;
      views.forEach(function(view){
        RedisService.del('rdocs_view_show_' + view.name);
      });
    });

    Star.findOrCreate({
      where: {
        user_id: user.id,
        package_name: packageName
      }
    }).spread(function(instance, created) {
      var destroyPromise = created ? Promise.resolve() : instance.destroy();
      destroyPromise.then(function() {
        return Star.findAll({
          where: { package_name: packageName }
        }).then(function(stars) {
          var newCount = stars.length;
          if (created) {
            res.created({
              newCount: newCount,
              star: instance
            });
          } else
            return res.send(200, {
              newCount: newCount,
              star: 'deleted'
            });
        });

      });
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },

  /**
  * @api {get} api/light/packages/:name Request Package Information for Rdocs light
  * @apiName Get Package
  * @apiGroup Light
  *
  * @apiParam {String} name Name of the package
  *
  * @apiSuccess {String}   name             Package name
  * @apiSuccess {String}   url              Url to the package
  * @apiSuccess {Object}   version          Information about the version of the package
  * @apiSuccess {String}   version.version  String describing the latest version of the package
  * @apiSuccess {String}   version.url      Url to the version
  * @apiSuccess {String}   title            Title of the latest version
  * @apiSuccess {String}   description      Description of the latest package version
  * @apiSuccess {Object[]} anchors                       Anchors shown at the bottom of the widget
  * @apiSuccess {String}   anchors.title                 The title to be shown
  * @apiSuccess {String}   anchors.anchor                The Html-anchor linking to the section
  */
  lightPackageSearch: function(req, res) {
    var packageName = req.param('name');

    var key = 'light_' + packageName;
    if (packageName.endsWith('.html')) packageName = packageName.replace('.html', '');

    RedisService.getJSONFromCache(key, res, RedisService.DAILY, function() {
      return Package.getLatestVersionNumber(packageName).then(function(version){
        console.log(version.latest_version.version);
        var prefix = "rpackages/unarchived/" + packageName + "/" + version.latest_version.version + "/" + "vignettes/";
        var params = {
          Bucket: process.env.AWS_BUCKET,
          Delimiter: '/',
          Prefix: prefix
        };

        var vignettesPromise = s3.listObjects(params).promise();

        var packagePromise = Package.findOne({
          include:[{
            model:PackageVersion,
            as:'latest_version',
            required:true,
            include: [
              { model: Topic, as: 'topics',
                attributes: ['package_version_id', 'name', 'title', 'id'],
                separate: true }
            ]
          }],
          where:{
            name:packageName
          }
        });
        return Promise.join(vignettesPromise, packagePromise, function(vignettes, package){
          var version = {};
          version.package_name = package.name;
          version.url = 'https:' + process.env.BASE_URL + package.uri;
          version.version = {
            version: package.latest_version.version,
            url: 'https:' + process.env.BASE_URL + package.latest_version.uri
          };
          version.title = package.latest_version.title;
          version.description = package.latest_version.description;

          version.anchors = [];
          TopicService.addAnchorItem(version.anchors, package.latest_version.readmemd, "readme", "readme");
          TopicService.addAnchorItem(version.anchors, package.latest_version.topics, "topics", "functions");
          TopicService.addAnchorItem(version.anchors, vignettes.Contents, "vignettes", "vignettes");
          TopicService.addAnchorItem(version.anchors, [true], "downloads", "downloads");
          TopicService.addAnchorItem(version.anchors, [true], "details", "details");

          return version;
        });
      });
    })
    .then(function(version){
      return res.json(version);
    })
    .catch(function(err) {
      return res.negotiate(err);
    });

  }
};

