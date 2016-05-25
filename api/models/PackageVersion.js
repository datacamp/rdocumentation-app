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
      notNull: true,
      required: true
    },

    title: {
      type: 'String',
      notNull: true,
      required: true
    },

    description: {
      type: 'String',
      notNull: true,
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
      notNull: true,
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

