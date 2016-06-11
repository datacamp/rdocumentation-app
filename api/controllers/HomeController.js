/**
 * HomeController
 *
 * @description :: Server-side logic for the home page statistics
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
 var Promise = require('bluebird');
module.exports = {

  index: function(req, res) {
    Promise.join(Package.count(), PackageVersion.count(), Collaborator.count(),
      function(nbPackages, nbPackageVersions, nbCollaborators) {
        return res.ok({nbPackages: nbPackages, nbPackageVersions: nbPackageVersions, nbCollaborators: nbCollaborators}, 'homepage.ejs');
    }).catch(function(err) {
      return res.negotiate(err);
    });

  },
};

