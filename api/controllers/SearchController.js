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
              should: [
                {
                  term: {
                    "package_name" : token,
                    "boost": 2.0
                  }
                },
                {
                  match_phrase_prefix : {
                      "package_name" : {
                          "query" : token,
                          "max_expansions" : 20
                      }
                  }
                }
              ],
              "minimum_number_should_match": 1,
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

            bool: {
              should: [
                {
                  term: {
                    "package_name" : token,
                    "boost": 2.0
                  }
                },
                {
                  prefix : {
                    name: token,
                  }
                }
              ],
              "minimum_number_should_match": 1,
              filter: {
                has_parent : {
                  parent_type : "package_version",
                  query : {
                    term : {
                        latest_version : 1
                    }
                  },
                  inner_hits : { fields: ['package_name', 'version', 'latest_version'] }
                }
              }
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
        var inner_hit = hit.inner_hits.package_version.hits.hits[0];
        var package_name = inner_hit.fields.package_name[0];
        var version = inner_hit.fields.version[0];
        var uri =  sails.getUrlFor({ target: 'Topic.findById' })
          .replace(':id', id)
          .replace('/api/', '/');
        return { uri: uri,  name: name, package_name: package_name, package_version: version };
      });
      return res.json({packages: packages, topics: topics});
    }).catch(function(err) {
      return res.negotiate(err);
    });

  },


  fullSearch: function(req, res) {
    var query = req.param('q');
    var searchTopicQuery = {
      multi_match: {
        query: query,
        type: "best_fields",
        fields: [
          'name^6',
          'title^3', 'description^3', 'keywords^3', 'aliases^3',
          'arguments.name^2', 'arguments.description^2',
          'details^2', 'value^2',
          'note', 'author',
          'references', 'license', 'url', 'copyright']
      }
    };

    es.search({
      index: 'rdoc',
      body: {
        query: {
          bool : {
            should : [
              {
                bool: {
                  filter:[
                    {
                      type : {
                        value : "package_version"
                      }
                    }
                  ],
                  should:[
                    {
                      multi_match: {
                        query: query,
                        type: "best_fields",
                        fields: ['package_name^4', 'title^3', 'description^2', 'license', 'url', 'copyright']
                      },
                    },
                    { term: { latest_version: 1, boost:2.0 } }
                  ],
                  minimum_should_match : 1,
                }
              },
              {
                bool: {
                  filter:[
                    {
                      type : {
                        value : "topic"
                      }
                    }
                  ],
                  should: [
                    searchTopicQuery,
                    {
                      has_parent : {
                        parent_type : "package_version",
                        query : {
                          term : {
                            latest_version : 1
                          }
                        },
                        inner_hits : { fields: ['package_name', 'version', 'latest_version'] }
                      }
                    }
                  ],
                  minimum_should_match : 2,
                }
              }
            ],
            minimum_should_match : 1,
          }
        },
        highlight : {
          pre_tags : ["<mark>"],
          post_tags : ["</mark>"],
          "fields" : {
            "title" : {highlight_query: {
               match : {
                  title : query
              }
            }},
            "description": {highlight_query: {
               match : {
                  description : query
              }
            }},
            "name": {highlight_query: searchTopicQuery},
            "keywords": {highlight_query: searchTopicQuery},
            "aliases": {highlight_query: searchTopicQuery},
            "arguments.name": {highlight_query: searchTopicQuery},
            "arguments.description": {highlight_query: searchTopicQuery},
            "details": {highlight_query: searchTopicQuery},
            "value": {highlight_query: searchTopicQuery},
            "note": {highlight_query: searchTopicQuery},
            "author": {highlight_query: searchTopicQuery},
            "references": {highlight_query: searchTopicQuery},
            "license": {highlight_query: searchTopicQuery},
            "url": {highlight_query: searchTopicQuery},
            "copyright": {highlight_query: searchTopicQuery}
          }
        },
        from: 0,
        size: 10,
        fields: ['package_name', 'version', 'name']
      }
    }).then(function(response) {
      //return res.json(response);
      var hits = response.hits.hits.map(function(hit) {
        var fields = {};
        if (hit._type === 'package_version') {
          fields.package_name = hit.fields.package_name[0];
          fields.version = hit.fields.version[0];
        } else if (hit._type === 'topic') {
          console.log(hit.inner_hits);
          var inner_hits_fields = hit.inner_hits.package_version.hits.hits[0].fields;
          fields.package_name = inner_hits_fields.package_name[0];
          fields.version = inner_hits_fields.version[0];
          fields.name = hit.fields.name[0];
        }
        return {
          fields: fields,
          type: hit._type,
          score: hit._score,
          highlight: hit.highlight
        };
      });
      return res.ok({hits: hits}, 'search/result.ejs');
    }).catch(function(err) {
      return res.negotiate(err);
    });


  }

};
