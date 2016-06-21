var _ = require('lodash');
var Promise = require('bluebird');

module.exports = {

  aggregateAuthors: function() {
    var getDuplicatesAuthors = function () {
      return sequelize.query("SELECT name FROM (select name, email, count(*) as sum from Collaborators group by name, email order by sum desc) s where s.sum > 1;", { type: sequelize.QueryTypes.SELECT});
    };

    return getDuplicatesAuthors().then(function(names) {
      return Promise.map(names, function(nameInstance) {
        var name = nameInstance.name;
        return Collaborator.findAll({
          where: {name: name},
          order: [['email', 'DESC']],
          include: [{
            model: PackageVersion,
            as: 'authored_packages',
            attributes: ['id']
          }]
        }).then(function(collaborators) {
          var stays = collaborators[0];
          var others = collaborators.slice(1);
          var authored = _.reduce(others, function(acc, collaborator) {
            return acc.concat(collaborator.authored_packages);
          }, []);

          var associate = stays.addAuthored_packages(authored);

          var remove = Promise.map(others, function(other) {
            return other.destroy();
          });

          return Promise.join(associate, remove, function(result, removeResult) {
            console.info("done: "+ name);
            return {name: name, result: 'success'};
          });
        });

      });
    });

  }

};
