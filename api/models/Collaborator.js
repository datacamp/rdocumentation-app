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
        return '/collaborators/:id'
          .replace(':id', encodeURIComponent(this.id));
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
        var where = author;
        if(author.email) {
          where = {
            email: author.email
          };
        }
        else {
          where = {
            name: author.name
          };
        }

        var params = _.defaults({
          where: where,
          defaults: author,
          order: [['email', 'DESC']]
        }, options);

        return Collaborator.findOrCreate(params)
        .spread(function(instance, created) {
          if (instance.email === null && author.email) {
            return instance.update({email: author.email}, options);
          } else return instance;
        });
      },

      insertAllAuthors2: function(json,version){
        promises = [];
        json.contributors.forEach(function(contributor){
          promises.push(Collaborator.insertAuthor(contributor).then(function(auth){
            return version.addCollaborator(auth);
          }));
        });
        if(json.maintainer){
        var maintainer = json.maintainer;
        promises.push(Collaborator.insertAuthor(maintainer).then(function(auth){
           return version.addCollaborator(auth).then(function(){
             version.maintainer_id = auth.id;
             return version.save();
           });
         }));
      } 
        return Promise.all(promises);
      },

      insertAllAuthors: function(json,version){
        return Promise.map(json.contributors,function(contributor){
          return Collaborator.insertAuthor(contributor).then(function(auth){
            return version.addCollaborator(auth);
          });
        }).then(function(){
          if(json.maintainer){
        var maintainer = json.maintainer;
        return Collaborator.insertAuthor(maintainer).then(function(auth){
           return version.addCollaborator(auth).then(function(){
             version.maintainer_id = auth.id;
             return version.save();
           });
         });
      }

        });
      }

    }

  }

};