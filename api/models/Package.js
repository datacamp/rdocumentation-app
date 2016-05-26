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
    Package.hasMany(PackageVersion, {as: 'package', foreignKey: 'package_name'});
    Package.belongsTo(PackageVersion, { as: 'latest_version', constraints: false});
    Package.belongsToMany(PackageVersion, { as: 'dependencies', foreignKey: 'dependency_name', through: Dependency, constraints: false});
  },

  options: {
    underscored: true
  }
};

