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
          return Collaborator.deleteOrphans().then(function() {
            return collaborators.concat(maintainer);
          });
        });

      },

      deleteOrphans: function() {
        var query = "DELETE o FROM Collaborators o LEFT JOIN Collaborations co ON o.id = co.author_id LEFT JOIN PackageVersions p ON p.maintainer_id = o.id WHERE co.author_id IS NULL AND p.maintainer_id IS NULL;";

        return sequelize.query(query, {type: sequelize.QueryTypes.DELETE});
      },

      topCollaborators: function(){
        var query = "SELECT coll.name, Sum(direct_downloads) as total From Packages pack INNER JOIN PackageVersions versions ON pack.latest_version_id=versions.id INNER JOIN Collaborators coll ON versions.maintainer_id = coll.id INNER JOIN DownloadStatistics downloads ON pack.name=downloads.package_name WHERE "+
          "downloads.date >= current_date() - interval '1' month group by coll.name order by total desc limit 0,10";
        return sequelize.query(query, {type: sequelize.QueryTypes.SELECT});
      }

    }

  }

};
