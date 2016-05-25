/**
 * PackageVersion.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    version: {
      type: 'String',
      unique: true,
      required: true
    },

    title: {
      type: 'String',
      required: true
    },

    description: {
      type: 'String',
      required: true
    },

    authors: {
      collection: 'collaborator',
      via: 'authoredPackages'
    },

    releaseDate: {
      type: 'date'
    },

    license: {
      type: 'String',
      required: true
    },

    maintainer: {
      model: 'collaborator'
    },

    package: {
      model: 'package'
    },

    dependencies: {
      collection: 'package',
      via: 'dependant',
      through: 'dependency'
    }
  }
};

