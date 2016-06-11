/**
 * Collaborator.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models

 */
var _ = require('lodash');
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
          .replace(':id', this.id);
      },
      uri: function()  {
        return '/collaborators/:id'
          .replace(':id', this.id);
      },
      gravatar_url: function(){
        return 'https://www.gravatar.com/avatar/' + md5(_.trim(this.email).toLowerCase());
      }
    },
    underscored: true
  }

};

