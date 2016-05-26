/**
 * Collaborator.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
   attributes: {

    name : {
      type: 'String',
      required: true,
      notNull: true
    },

    email : {
      type: 'String',
    },

    maintainedPackages: {
      collection: 'packageVersion',
      via: 'maintainer'
    },

    authoredPackages: {
      collection: 'packageVersion',
      via: 'authors'
    }

  }
 */

module.exports = {

  attributes: {
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },

    email: {
      type: Sequelize.STRING
    }

  },
  associations: function() {
    Collaborator.belongsToMany(PackageVersion, {as: 'authors', through: 'Collaboration', foreignKey: 'author_id'});
    Collaborator.hasMany(PackageVersion, {as: 'maintained_packages', foreignKey: 'maintainer_id'});
  },

  options: {
    underscored: true
  }

};

