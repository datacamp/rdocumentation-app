/**
 * Collaborator.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models

 */
var _ = require('lodash');
var Promise = require('bluebird');
var md5 = require('md5');

module.exports = {

  attributes: {
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },

    email: {
      type: Sequelize.STRING,
      unique: true
    }

  },
  associations: function() {
    Collaborator.belongsToMany(PackageVersion, {as: 'authored_packages', through: 'Collaborations', foreignKey: 'author_id', timestamps: false});
    Collaborator.hasMany(PackageVersion, {as: 'maintained_packages', foreignKey: 'maintainer_id'});
  },

  options: {
    getterMethods: {
      api_uri: function()  {
        return '/api/collaborators/:id'
          .replace(':id', encodeURIComponent(this.id));
      },
      uri: function()  {
        return '/collaborators/name/:name'
          .replace(':name', encodeURIComponent(this.name));
      },
      gravatar_url: function(){
        return 'https://www.gravatar.com/avatar/' + md5(_.trim(this.email).toLowerCase());
      }
    },
    underscored: true,



    classMethods: {
      /**
      * author is an object with attributes name and optionnally email
      *
      */
      insertAuthor: function(author, options) {
        var where = {
          name: author.name,
          email: null
        };

        if(author.email) {
          author.email = author.email.toLowerCase();
          where = {
            email: author.email
          };
        }

        var params = _.defaults({
          where: where,
          defaults: author,
          order: [['email', 'DESC']]
        }, options);
        return Collaborator.findOrCreate(params)
        .spread(function(instance, created) {
          return instance;
        });
      },

      replaceAllAuthors: function(json,version, options) {


        var deleteMaintainerPromise = Collaborator.destroy(_.defaults({
          where: {id: version.id},
        }, options));

        var deleteContributors = version.getCollaborators().then(function(contributors) {
          var ids = _.map(contributors, 'id');
          return Collaborator.destroy(_.defaults({
            where: {id: {$in: ids}},
          }, options));
        });


        return Promise.join(deleteMaintainerPromise, deleteContributors, function() {
          var collaboratorsPromise = Promise.mapSeries(json.contributors, function(contributor){
            return Collaborator.insertAuthor(contributor, options);
          }).then(function(collaboratorInstances) {
            var collaborators = _.uniqBy(collaboratorInstances, 'id');
            return version.setCollaborators(collaborators, options);
          });

          var maintainerPromise = json.maintainer ?
            Collaborator.insertAuthor(json.maintainer, options).then(function(auth){
              version.maintainer_id = auth.id;
              return version.save(options).then(function(v) {
                return auth;
              });
            }) : Promise.resolve(null);

          return Promise.join(collaboratorsPromise, maintainerPromise, function(collaborators, maintainer) {
            return collaborators.concat(maintainer);
          });

        });


      }

    }

  }

};
