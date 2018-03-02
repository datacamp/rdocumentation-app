/**
 * HomeController
 *
 * @description :: Server-side logic for the home page statistics
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');
var numeral = require('numeral');

module.exports = {

  index: function(req, res) {
    RedisService.getJSONFromCache('home_page_info', res, RedisService.DAILY, function() {
      var json = {};
      json.description = 'Search current and past R documentation and R manuals from CRAN, GitHub and Bioconductor. Use the Rdocumentation package for easy access inside RStudio.';

      var promises = [];
      promises.push(sequelize.query('SELECT (SELECT COUNT(*) FROM Packages) as package_count, (SELECT COUNT(*) FROM PackageVersions) as topic_count, (SELECT COUNT(*) FROM (SELECT DISTINCT name from Collaborators) c) as collaborator_count;')
        .then(function(counts) {
          json.numbers = counts[0].map(function(row) {
            return {nbPackages: numeral(row.package_count).format('0,0'), nbPackageVersions: numeral(row.topic_count).format('0,0'), nbCollaborators: numeral(row.collaborator_count).format('0,0')};
          })[0];
        }));

      promises.push(PackageVersion.getNewestPackages(1).then(function(data) {
        json.newPackages = data;
      }));
      promises.push(Collaborator.topCollaborators(1).then(function(data) {
        json.topCollaborators = data.results;
      }));
      promises.push(DownloadStatistic.getMostPopularPerPage(1, 'direct').then(function(data) {
        json.mostPopular = data.results;
      }));

      return Promise.all(promises).then(function(){
        json.pageTitle = 'R Documentation and manuals';
        return json;
      });
    }).then(function(json) {
      return res.ok(json, 'homepage.ejs');
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },

  status: function(req, res) {
    return res.ok();
  }
};

