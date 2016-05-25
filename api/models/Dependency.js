/**
 * Dependency.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    dependency: {
      model: 'package',
    },

    dependant: {
      model: 'packageVersion',
    },

    version: {
      model: 'String'
    },

    comparator: {
      type: 'String',
      enum: ['le', 'eq', 'ge', 'gt', 'lt']
    }

  }
};

