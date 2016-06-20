/**
 * Dependency.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {


  attributes: {

    dependency_version: {
      type: Sequelize.STRING
    },

    version_comparator: {
      type: Sequelize.ENUM('<', '<=', '=', '>=', '>')
    },

    type: {
      type: Sequelize.ENUM('depends', 'imports', 'suggests', 'enhances'),
      allowNull: true
    }

  },

  associations: function() {
  },

  options: {
    underscored: true,
    timestamps: false,

    classMethods: {
      findByDependant: function(dependant_package_name) {
        return sequelize.query("SELECT DISTINCT d.dependency_name from Dependencies d INNER JOIN PackageVersions p on d.dependant_version_id = p.id WHERE p.package_name = ?;",{ replacements: [dependant_package_name], type: sequelize.QueryTypes.SELECT}).then(function(data){

          return data;
        });
      }
    }
  }

};

