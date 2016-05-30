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

};

