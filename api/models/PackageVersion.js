/**
 * PackageVersion.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var Promise = require('bluebird');

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
      type: Sequelize.DATE,
    },

    license: {
      type: Sequelize.STRING,
      allowNull: false
    }
  },
  associations: function() {
    PackageVersion.belongsTo(Package,
      {
        as: 'package',
        foreignKey: {
          allowNull: false,
          name:'package_name',
          as: 'package'
        },
        onDelete: 'CASCADE'
      });
    PackageVersion.belongsToMany(Package,
      { as: 'dependencies',
        through: Dependency,
        foreignKey: {
          name: 'dependant_version_id',
          as: 'dependencies'
        }
      });
    PackageVersion.belongsTo(Collaborator,
      {
        as: 'maintainer',
        foreignKey: {
          allowNull: false,
          name: 'maintainer_id',
          as: 'maintainer'
        }
      });
    PackageVersion.belongsToMany(Collaborator, {as: 'authors', through: 'Collaborations', foreignKey: 'authored_version_id'});
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

