/**
 * Package.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: Sequelize.STRING,
      unique: true,
      primaryKey: true,
      allowNull: false
    }

  },
  associations: function() {
    Package.hasMany(PackageVersion,
      {
        as: 'versions',
        foreignKey: {
          name: 'package_name',
          as: 'versions'
        }
      }
    );
    Package.belongsTo(PackageVersion, {
      as: 'latest_version',
      foreignKey: {
        name:'latest_version_id',
        as: 'latest_version'
      },
      constraints: false }
    );
    Package.belongsToMany(PackageVersion, { as: 'reverse_dependencies', foreignKey: 'dependency_name', through: Dependency, constraints: false});
  },

  options: {
    getterMethods: {
      uri: function()  {
        return '/api/packages/:name'
          .replace(':name', this.getDataValue('name'));
      }
    },
    underscored: true
  }
};

