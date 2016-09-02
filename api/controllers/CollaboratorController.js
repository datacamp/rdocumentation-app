/**
 * CollaboratorController
 *
 * @description :: Server-side logic for managing collaborators
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var _ = require('lodash');
var md5 = require('md5');
var request = require('request');
var Promise = require('bluebird');
var numeral = require('numeral');



var self = module.exports = {



	findById: function(req, res) {
    var id = req.param('id');

    Collaborator.findOne({
      where: {
        id: id
      }
    }).then(function(collaboratorInstance) {
      if(collaboratorInstance === null) return res.notFound();
      else {
        return res.rstudio_redirect(301, collaboratorInstance.uri);
      }
    }).catch(function(err) {
      return res.negotiate(err);
    });

  },


  findByName: function(req, res) {
    var name = req.param('name');


    Package.findAll({
      include: [
        { model: Repository,
          as: 'repository'
        },
        { model: PackageVersion,
          as: 'latest_version',
          attributes:['id', 'package_name', 'version', 'title', 'description', 'release_date', 'license', 'url', 'maintainer_id'],
          include: [
            { model: Collaborator, as: 'maintainer' },
            { model: Collaborator, as: 'collaborators'},
          ]
        }
      ],
      where: {
        $or:[
          sequelize.literal("`latest_version.maintainer`.`name` = '" + name + "'"),
          sequelize.literal("`latest_version.collaborators`.`name` = '" + name + "'"),
        ]
      }
    }).then(function(packages) {
      if(packages === null) return res.notFound();
      else {
        var json = {name: name };
        repositories = {
          cran: 0,
          bioconductor: 0,
          github: 0
        };

        Promise.map(packages, function(package) {
          var latest = package.latest_version.toJSON();
          if (latest.maintainer.name === name) {
            latest.is_maintainer = true;
          }
          var collaborators = _.filter(latest.collaborators, function(c) {
            return c.name === name;
          });

          if (collaborators.length > 0) {
            latest.is_contributor = true;
          }
          if(!json.email && latest.is_maintainer && latest.maintainer.email) {
            json.email = latest.maintainer.email;
          }
          if(!json.email && collaborators.length > 0 && collaborators[0].email) {
            json.email = collaborators[0].email;
          }
          repositories[package.repository.name] = repositories[package.repository.name]+1 || 1;

          return Package.getPackagePercentile(latest.package_name).then(function(percentileObject) {
            latest.percentile = isNaN(percentileObject.percentile) ? -1 : percentileObject.percentile;
            latest.totalDownloads = percentileObject.total;
            latest.repoName = package.repository.name;
            return latest;
          });

        }).then(function(packages) {
          json.gravatar_url = 'https://www.gravatar.com/avatar/' + md5(_.trim(json.email).toLowerCase());
          json.packages = _.orderBy(packages, ['is_maintainer', 'percentile', 'totalDownloads'], ['asc', 'desc', 'desc']);
          json.repositories = repositories;
          return res.ok(json,"collaborator/show.ejs");
        });

      }
    });
  },
/**
  * @api {get} /collaborators/name/:name/downloads Maintainer downloads
  * @apiName The downloads of a maintainer
  * @apiGroup Collaborator
  * @apiDescription The number of combined direct downloads of all packages of which the last version is maintained by the given user.
  *
  * @apiParam   {String}    name      The name of the maintainer.
  *
  * @apiSuccess {Integer}   total     The total amount of direct downloads as described.
  * @apiSuccess {String}    totalStr  The total given as as string.
  */
  getNumberOfDirectDownloads: function(req,res){
    var name = req.param('name');
    DownloadStatistic.getNumberOfDirectDownloads(name).then(function(results){
      row = results[0];
      row.totalStr = row.total ? numeral(row.total).format('0,0') : '';
      res.json(results[0]);
    });
  },
/**
  * @api {get} /collaborators/name/:name/downloads Maintainer downloads
  * @apiName The downloads of a maintainer
  * @apiGroup Collaborator
  * @apiDescription The number of combined direct downloads of all packages of which the last version is maintained by the given user.
  *
  * @apiParam   {String}    name      The name of the maintainer.
  *
  * @apiSuccess {Integer}   total     The total amount of direct downloads as described.
  * @apiSuccess {String}    totalStr  The total given as as string.
  */
  getDepsyData: function(req,res){
    var name = req.param('name');
    request("http://depsy.org/api/search/"+name,function(error,response,body){
      if(!error && response.statusCode == 200){
        var resjson = JSON.parse(body);
        if(resjson.count>0){
          var id = resjson.list[0].id;
          request("http://depsy.org/api/person/"+id,function(error,response,body){
          if(!error && response.statusCode == 200){
            var json = JSON.parse(body);
            return res.json(json);
          }else{
            return res.json({});
          }
          });
        }else{
          return res.json({});
        }
      }
      else{
        return res.json({});
      }
    });
  }
};

