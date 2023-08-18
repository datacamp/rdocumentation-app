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

module.exports = {
  findById: function(req, res) {
    var id = req.param('id');

    Collaborator.findOne({
      where: {
        id: id
      }
    }).then(function(collaboratorInstance) {
      if (collaboratorInstance === null) return res.notFound();
      return res.rstudio_redirect(301, collaboratorInstance.uri);
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },


  findByName: function(req, res) {
    return res.redirect(302, "https://rdocumentation.org" + req.path);
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
  getNumberOfDirectDownloads: function(req, res) {
    var name = req.param('name');
    DownloadStatistic.getNumberOfDirectDownloads(name).then(function(results) {
      var row = results[0];
      row.totalStr = row.total ? numeral(row.total).format('0,0') : '';
      res.json(results[0]);
    }).catch(function(err) {
      return res.negotiate(err);
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
  getDepsyData: function(req, res) {
    var name = req.param('name');
    request('http://depsy.org/api/search/' + name, function cb(error, response, body) {
      if (!error && response.statusCode === 200) {
        var resjson = JSON.parse(body);
        if (resjson.count > 0) {
          var id = resjson.list[0].id;
          request('http://depsy.org/api/person/' + id, function cb(error, response, body) {
            if (!error && response.statusCode === 200) {
              var json = JSON.parse(body);
              return res.json(json);
            }
            return res.json({});
          });
        } else {
          return res.json({});
        }
      } else {
        return res.json({});
      }
    });
  }
};

