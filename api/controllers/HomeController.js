/**
 * HomeController
 *
 * @description :: Server-side logic for the home page statistics
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
 var Promise = require('bluebird');
module.exports = {

  index: function(req, res) {
    console.log('index');
    sequelize.query("SELECT (SELECT COUNT(*) FROM Packages) as package_count, (SELECT COUNT(*) FROM PackageVersions) as topic_count, (SELECT COUNT(*) FROM Collaborators) as collaborator_count;")
      .then(function(counts) {
        var json = counts[0].map(function(row) {
          return {nbPackages: row.package_count, nbPackageVersions: row.topic_count, nbCollaborators: row.collaborator_count};
        })[0];
        return res.ok(json, 'homepage.ejs');
      })
      .catch(function(err) {
      return res.negotiate(err);
    });

  },
};

