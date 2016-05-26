/**
 * Dependency.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 unique

 autoPK: false,

  attributes: {
    dependency: {
      model: 'package',
      required: true,
      columnName: 'dependency_package_name'
    },

    dependant: {
      model: 'packageversion',
      required: true,
      columnName: 'dependant_package_version'
    },

    dependencyVersion: {
      model: 'String',
      columnName: 'dependency_version',
      required: false
    },

    comparator: {
      type: 'String',
      required: false,
      enum: ['le', 'eq', 'ge', 'gt', 'lt']
    }

  }
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

