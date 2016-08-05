/**
 * CollaboratorController
 *
 * @description :: Server-side logic for managing collaborators
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var _ = require('lodash');
var md5 = require('md5');

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
        return res.redirect(301, collaboratorInstance.uri);
      }
    }).catch(function(err) {
      return res.negotiate(err);
    });

  },


  findByName: function(req, res) {
    var name = req.param('name');


    Package.findAll({
      include: [
        { model: PackageVersion,
          as: 'latest_version',
          attributes:['id', 'package_name', 'version', 'title', 'release_date', 'license', 'url', 'maintainer_id'],
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

        json.packages = _.map(packages, function(package) {
          var latest = package.latest_version;
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
          return latest;
        });
        json.gravatar_url = 'https://www.gravatar.com/avatar/' + md5(_.trim(json.email).toLowerCase());
        json.packages = _.sortBy(json.packages, ['is_maintainer']);

        return res.ok(json, 'collaborator/show.ejs');
      }
    });


  }
};

