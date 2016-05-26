/**
 * PackageVersion.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    version: {
      type: Sequelize.STRING,
      allowNull: false
    },


    title: {
      type: Sequelize.STRING,
      allowNull: false
    },

    description: {
      type: Sequelize.STRING,
      allowNull: false
    },

    release_date: {
      type: Sequelize.STRING,
    },

    license: {
      type: Sequelize.STRING,
      allowNull: false
    },


  },
  associations: function() {
    PackageVersion.belongsToMany(Package, { as: 'dependants', through: Dependency, foreignKey: 'dependant_version_id'});
    PackageVersion.belongsToMany(Collaborator, {as: 'authored_packages', through: 'Collaborations', foreignKey: 'authored_version_id'});
  },

  options: {
    indexes: [
      {
        type: 'UNIQUE',
        fields: ['package_name', 'version']
      }
    ],

    underscored: true
  }
};

