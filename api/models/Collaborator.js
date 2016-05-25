/**
 * Collaborator.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name : {
      type: 'String',
      required: true
    },

    email : {
      type: 'String',
    },

    maintainedPackages: {
      collection: 'packageVersion',
      via: 'maintainer'
    },

    authoredPackages: {
      collection: 'packageVersion',
      via: 'authors'
    }

  }
};

