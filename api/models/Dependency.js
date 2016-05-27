/**
 * Dependency.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {


  attributes: {

    dependency_version: {
      type: Sequelize.STRING,
      required: false
    },

    comparator: {
      type: Sequelize.ENUM('le', 'eq', 'ge', 'gt', 'lt'),
      required: false
    }

  },

  associations: function() {
  },

};

