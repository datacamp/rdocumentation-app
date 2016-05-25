/**
 * Package.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: 'String',
      unique: true,
      required: true
    },

    packageVersion: {
      collection: 'packageVersion',
      via: 'package'
    },

    reverseDependencies: {
      collection: 'packageVersion',
      via: 'dependency',
      through: 'dependency'
    }
  }
};

