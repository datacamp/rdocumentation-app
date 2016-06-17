/**
 * SearchController
 *
 * @description :: Server-side logic for searching
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
 var Promise = require('bluebird');
 var _ = require('lodash');

module.exports = {

  quickSearch: function(req, res) {
    var token = req.body.token;

    es.msearch({
      body: [
        { index: 'rdoc', type: 'package_version' },
        { query: {
            bool: {
              must: [{
                prefix : {
                  package_name: token,
                }
              }],
              filter: {
                term: { latest_version: 1 }
              }
            }
          },
          size: 5,
          fields: ['package_name', 'version']
        },

        { index: 'rdoc', type: 'topic' },
        { query: {
            prefix : {
              name: token,
            }
          },
          size: 5,
          fields: ['name']
        },

    ]}).then(function(response) {
      var packageResult = response.responses[0];
      var topicResult = response.responses[1];
      var packages = _.map(packageResult.hits.hits, function(hit) {
        var name = hit.fields.package_name[0];
        var version = hit.fields.version[0];
        var uri = sails.getUrlFor({ target: 'PackageVersion.findByNameVersion' })
          .replace(':name', name)
          .replace(':version', version)
          .replace('/api/', '/');
        return { uri: uri,  name: name };
      });

      var topics = _.map(topicResult.hits.hits, function(hit) {
        var name = hit.fields.name[0];
        var id = hit._id;
        var uri =  sails.getUrlFor({ target: 'Topic.findById' })
          .replace(':id', id)
          .replace('/api/', '/');
        return { uri: uri,  name: name };
      });
      return res.json({packages: packages, topics: topics});
    }).catch(function(err) {
      return res.negotiate(err);
    });

  }

};
