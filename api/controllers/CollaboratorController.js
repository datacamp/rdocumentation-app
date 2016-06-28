/**
 * CollaboratorController
 *
 * @description :: Server-side logic for managing collaborators
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var _ = require('lodash');

module.exports = {

	findById: function(req, res) {
    var id = req.param('id');

    Collaborator.findOne({
      where: {
        id: id
      },
      include: [
        { model: PackageVersion, as: 'maintained_packages', attributes:['id', 'package_name', 'version', 'title', 'release_date', 'license', 'url', 'maintainer_id'], separate: true},
        { model: PackageVersion, as: 'authored_packages', attributes:['id', 'package_name', 'version', 'title', 'release_date', 'license', 'url'] },
      ]
    }).then(function(collaboratorInstance) {
      if(collaboratorInstance === null) return res.notFound();
      else {
        var collaborator = collaboratorInstance.toJSON();
        collaborator.pageTitle = collaborator.name;
        groupedMaintained = _.groupBy(collaborator.maintained_packages, 'package_name');
        groupedAuthored = _.groupBy(collaborator.authored_packages, 'package_name');

        var mapGrouped = function (packages) {
          var sorted = _.sortBy(packages, 'version');
          var latest = _.first(sorted);
          var versions = _.map(sorted, function(v) {
            return _.pick(v, ['version', 'uri', 'api_uri']);
          });
          latest.versions = versions;
          return latest;
        };

        collaborator.maintained_packages = _(groupedMaintained).mapValues(mapGrouped).toArray().value();
        collaborator.authored_packages = _(groupedAuthored).mapValues(mapGrouped).toArray().value();

        return res.ok(collaborator, 'collaborator/show.ejs');
      }
    }).catch(function(err) {
      return res.negotiate(err);
    });

  },
};

