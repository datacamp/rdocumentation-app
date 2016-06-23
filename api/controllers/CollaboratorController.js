/**
 * CollaboratorController
 *
 * @description :: Server-side logic for managing collaborators
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	findById: function(req, res) {
    var id = req.param('id');
    var populateLimit = req._sails.config.blueprints.populateLimit;

    Collaborator.findOne({
      where: {
        id: id
      },
      include: [
        { model: PackageVersion, as: 'maintained_packages', limit: populateLimit },
        { model: PackageVersion, as: 'authored_packages' },
      ]
    }).then(function(collaborator) {
      if(collaborator === null) return res.notFound();
      else {
        collaborator.pageTitle = collaborator.name;
        return res.ok(collaborator, 'collaborator/show.ejs');
      }
    }).catch(function(err) {
      return res.negotiate(err);
    });

  },
};

