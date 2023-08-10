/**
 * SearchController
 *
 * @description :: Server-side logic for searching
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');
var _ = require('lodash');
var striptags = require('striptags');
var querystring = require('querystring');
var numeral = require('numeral');

var splitInPackageAndFunction = function(query) {
  return decodeURIComponent(query).split('::');
};

var isInPackageSearch = function(query) {
  return splitInPackageAndFunction(query).length === 2;
};

module.exports = {
  /**
  * @api {post} /quick_search Quick search
  * @apiName quick search
  * @apiGroup Search
  * @apiDescription Searches for the given keyword and gives top results for packages, functions and collaborators.
  *
  * @apiParam   {String}    token            The token on which is searched
  *
  * @apiSuccess {Object[]}  packages                    The packages related to the token.
  * @apiSuccess {String}    packages.uri                The link to the package.
  * @apiSuccess {String}    packages.name               The name of the package.
  * @apiSuccess {Object[]}  topics                      The topics (i.e. functions) related to the token.
  * @apiSuccess {String}    topics.uri                  The link to the topic.
  * @apiSuccess {String}    topics.name                 The name of the topic.
  * @apiSuccess {String}    topics.package_name         The name of the package of the topic.
  * @apiSuccess {String}    topics.package_version      The version of the package of the topic.
  * @apiSuccess {Object[]}  collaborators               The collaborators matching the token.
  * @apiSuccess {String}    collaborators.uri           The link to the page of the collaborator.
  * @apiSuccess {String}    collaborators.name          The name of the collaborator.
  */
  quickSearch: function(req, res) {
    var token = req.body.token;
    var topic = token;

    var packageMatchQuery = {
      has_parent: {
        parent_type: 'package_version',
        query: { term: { latest_version: 1 } },
        inner_hits: { fields: ['package_name', 'version', 'latest_version'] }
      }
    };

    var packageMatchQueryForPackage = {
      match_phrase_prefix: {
        package_name: {
          query: token,
          max_expansions: 20
        }
      }
    };

    if (isInPackageSearch(token)) {
      var packageAndFunction = splitInPackageAndFunction(token);
      topic = packageAndFunction[1];
      packageMatchQuery = {
        has_parent: {
          parent_type: 'package_version',
          query: {
            bool: {
              must: [
                {
                  term: { latest_version: 1 }
                },
                {
                  term: { package_name: packageAndFunction[0] }
                }
              ]
            }
          },
          inner_hits: { fields: ['package_name', 'version', 'latest_version'] }
        }
      };
      packageMatchQueryForPackage = {
        match: {
          package_name: {
            query: packageAndFunction[0]
          }
        }
      };
    }

    var packages; var topics; var collaborators;

    var elastic = es.msearch({
      body: [
        { index: 'rdoc', type: 'package_version' },
        { query: {
          bool: {
            should: [

              {
                'has_parent': {
                  'query': {
                    'function_score': {
                      'functions': [
                        {
                          'filter': { 'missing': { 'field': 'part_of_r' } },
                          'field_value_factor': {
                            'field': 'last_month_downloads',
                            'modifier': 'log1p'
                          }
                        },
                        {
                          'filter': { 'term': { 'part_of_r': 0 } },
                          'field_value_factor': {
                            'field': 'last_month_downloads',
                            'modifier': 'log1p'
                          }
                        },
                        {
                          'filter': { 'term': { 'part_of_r': 1 } },
                          'field_value_factor': {
                            'field': 'part_of_r',
                            'modifier': 'log1p',
                            'factor': 300000
                          }
                        }
                      ],
                      'boost_mode': 'multiply'
                    }
                  },

                  'parent_type': 'package',
                  'score_mode': 'score'
                }
              }
            ],
            'minimum_number_should_match': 2,
            filter: {
              bool: {
                must: [
                  packageMatchQueryForPackage,
                  {
                    term: { latest_version: 1 }
                  }
                ]
              }

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
                'multi_match': {
                  'query': topic,
                  'fields': [ 'aliases^2', 'name' ]
                }
              },
              {
                'multi_match': {
                  'fields': ['aliases^2', 'name'],
                  'query': topic,
                  boost: 0.2,
                  'type': 'phrase_prefix'
                }
              },
              {
                has_parent: {
                  'parent_type': 'package_version',
                  'score_mode': 'score',
                  query: {
                    'has_parent': {
                      'query': {
                        'function_score': {
                          'functions': [
                            {
                              'filter': { 'missing': { 'field': 'part_of_r' } },
                              'field_value_factor': {
                                'field': 'last_month_downloads',
                                'modifier': 'log1p'
                              }
                            },
                            {
                              'filter': { 'term': { 'part_of_r': 0 } },
                              'field_value_factor': {
                                'field': 'last_month_downloads',
                                'modifier': 'log1p'
                              }
                            },
                            {
                              'filter': { 'term': { 'part_of_r': 1 } },
                              'field_value_factor': {
                                'field': 'part_of_r',
                                'modifier': 'log1p',
                                'factor': 300000
                              }
                            }
                          ],
                          'boost_mode': 'replace'
                        }
                      },

                      'parent_type': 'package',
                      'score_mode': 'score'
                    }
                  }
                }
              }
            ],
            'minimum_number_should_match': 1,
            filter: packageMatchQuery
          }

        },
          size: 5,
          fields: ['name']
        }

      ]}).then(function(response) {
        var packageResult = response.responses[0];
        var topicResult = response.responses[1];
        packages = _.map(packageResult.hits.hits, function(hit) {
          var name = hit.fields.package_name[0];
          var version = hit.fields.version[0];
          var uri = sails.getUrlFor({ target: 'PackageVersion.findByNameVersion' })
          .replace(':name', encodeURIComponent(name))
          .replace(':version', encodeURIComponent(version))
          .replace('/api/', '/');
          return { uri: uri,  name: name };
        });

        topics = _.map(topicResult.hits.hits, function(hit) {
          var name = hit.fields.name[0];
          var id = hit._id;
          var inner_hit = hit.inner_hits.package_version.hits.hits[0];
          var package_name = inner_hit.fields.package_name[0];
          var version = inner_hit.fields.version[0];
          var uri = '/api/packages/:name/versions/:version/topics/:topic'
          .replace(':name', encodeURIComponent(package_name))
          .replace(':version', encodeURIComponent(version))
          .replace(':topic', encodeURIComponent(name))
          .replace('/api/', '/');
          return { uri: uri,  name: name, package_name: package_name, package_version: version };
        });
      });

    var coll = Collaborator.quickSearch(token).then(function(result) {
      collaborators = _.map(result, function(collaborator) {
        var uri = '/collaborators/name/' + encodeURIComponent(collaborator.name);
        return {uri: uri, name: collaborator.name};
      });
    });

    Promise.all([elastic, coll]).then(function() {
      return res.json({packages: packages, topics: topics, collaborators: collaborators});
    })
    .catch(function(err) {
      return res.negotiate(err);
    });
  },

  keywordSearch: function(req, res) {
    var keyword = req.param('keyword');
    var page = parseInt(req.param('page')) || 1;
    var perPage = parseInt(req.param('perPage')) || 10;
    var offset = (page - 1) * perPage;
    var nextPageQuery = _.clone(req.query);
    nextPageQuery.page = page + 1;

    var prevPageQuery = _.clone(req.query);
    prevPageQuery.page = page - 1;


    es.search({
      index: 'rdoc',
      body: {
        query: {
          bool: {
            filter: {
              type: {
                value: 'topic'
              }
            },
            must: [
              {
                term: {
                  keywords: keyword
                }
              },
              {
                has_parent: {
                  parent_type: 'package_version',
                  query: {
                    term: {
                      latest_version: 1
                    }
                  },
                  inner_hits: { fields: ['package_name', 'version', 'latest_version'] }
                }
              }
            ]
          }
        },
        highlight: {
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
          'fields': {
            'keywords': {
              highlight_query: {
                term: {
                  keywords: keyword
                }
              }
            }

          }
        },
        from: offset,
        size: perPage,
        fields: ['title', 'name', 'description', 'keywords']
      }

    }).then(function(response) {
      // return res.json(response);
      var hits = response.hits.hits.map(function(hit) {
        var fields = {};
        var highlight = hit.highlight;
        var inner_hits_fields = hit.inner_hits.package_version.hits.hits[0].fields;

        fields.package_name = inner_hits_fields.package_name[0];
        fields.version = inner_hits_fields.version[0];
        fields.name = hit.fields.name[0];

        highlight.title = hit.fields.title[0];
        highlight.description = hit.fields.description[0];

        return {
          fields: fields,
          type: hit._type,
          score: hit._score,
          highlight: hit.highlight
        };
      });
      return res.ok({
        total: numeral(response.hits.total).format('0,0'),
        hits: hits,
        perPage: perPage,
        currentPage: page,
        prevPageUrl: req.path + '?' + querystring.stringify(prevPageQuery),
        nextPageUrl: req.path + '?' + querystring.stringify(nextPageQuery),
        striptags: striptags,
        pageTitle: 'Search Results'
      }, 'search/keyword_result.ejs');
    })
    .catch(function(err) {
      return res.negotiate(err);
    });
  },

  packageSearch: function(req, res) {
    var query = req.param('q');
    var page = parseInt(req.param('page')) || 1;
    var perPage = parseInt(req.param('perPage')) || 15;
    var onlyLatestVersion = (parseInt(req.param('latest'))) === 1;
    var offset = (page - 1) * perPage;

    var packageVersionFilter = [
      {
        type: {
          value: 'package_version'
        }
      }
    ];
    if (onlyLatestVersion) {
      packageVersionFilter.push({ term: { latest_version: 1 } });
    }

    return es.search({
      index: 'rdoc',
      body: {
        query: {
          bool: {
            filter: packageVersionFilter,
            should: [
              {
                multi_match: {
                  query: query,
                  type: 'best_fields',
                  fields: ['package_name^6', 'title^4', 'maintainer.name^4', 'collaborators.name^3', 'description^3', 'license', 'url', 'copyright']
                }
              },
              {
                match_phrase_prefix: {
                  'package_name': {
                    'query': query,
                    'max_expansions': 20
                  }
                }
              },
              {
                'has_parent': {
                  'query': {
                    'function_score': {
                      'functions': [
                        {
                          'filter': { 'missing': { 'field': 'part_of_r' } },
                          'field_value_factor': {
                            'field': 'last_month_downloads',
                            'modifier': 'log1p'
                          }
                        },
                        {
                          'filter': { 'term': { 'part_of_r': 0 } },
                          'field_value_factor': {
                            'field': 'last_month_downloads',
                            'modifier': 'log1p'
                          }
                        },
                        {
                          'filter': {  'term': { 'part_of_r': 1 } },
                          'field_value_factor': {
                            'field': 'part_of_r',
                            'modifier': 'log1p',
                            'factor': 300000
                          }
                        }
                      ],
                      'boost_mode': 'replace'
                    }
                  },

                  'parent_type': 'package',
                  'score_mode': 'score'
                }
              }
            ],
            minimum_should_match: 1
          }
        },
        highlight: {
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
          'require_field_match': false,
          'fields': {
            'description': {
              'number_of_fragments': 0,
              highlight_query: {
                match: { description: query }
              }
            }
          }
        },
        from: offset,
        size: perPage,
        fields: ['package_name', 'version', 'description', 'maintainer.name']
      }
    }).then(function(result) {
      var packages  = [];
      result.hits.hits.forEach(function(hit) {
        var fields = {};
        fields.package_name = hit.fields.package_name[0];
        fields.version = hit.fields.version[0];
        fields.maintainer = hit.fields['maintainer.name'];
        var highlights = _.mapValues(hit.highlight, function(highlight) {
          return striptags(highlight.toString(), '<mark>');
        });

        var description = highlights.description || hit.fields.description[0];

        packages.push({
          description: description,
          fields: fields,
          score: hit._score
        });
      });
      res.locals.layout = null;
      if (req.headers.accept === 'application/json') {
        return res.json({
          packages: packages, hits: result.hits.total
        });
      }
      return res.view('search/package_results.ejs', { data: {packages: packages, hits: numeral(result.hits.total).format('0,0')}});
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },

  functionSearch: function(req, res) {
    var query = req.param('q');
    var package = req.param('package');
    var page = parseInt(req.param('page')) || 1;
    var perPage = parseInt(req.param('perPage')) || 15;
    var onlyLatestVersion = (parseInt(req.param('latest'))) === 1;
    var offset = (page - 1) * perPage;
    var searchTopicQuery = {
      multi_match: {
        query: query,
        type: 'best_fields',
        boost: 1,
        fields: [
          'aliases^6',
          'name^2',
          'title^2', 'description', 'keywords^2',
          'arguments.name', 'arguments.description',
          'details', 'value',
          'note', 'author']
      }
    };
    var prefixQuery = {
      'multi_match': {
        boost: 0.2,
        'fields': ['aliases^2', 'name'],
        'query': query,
        'type': 'phrase_prefix'
      }
    };

    var topicFilter = [
      {
        type: {
          value: 'topic'
        }
      }
    ];

    var packageMatchQuery;
    if (package === undefined) {
      packageMatchQuery = {
        has_parent: {
          parent_type: 'package_version'
        }
      };
      if (onlyLatestVersion) {
        packageMatchQuery.has_parent.query = {  term: { latest_version: 1 } };
        topicFilter.push(packageMatchQuery);
      }
    }    else {
      packageMatchQuery = {
        has_parent: {
          parent_type: 'package_version',
          query: {
            'bool': {
              'must': [
                {
                  term: { package_name: package }
                }
              ]
            }
          }
        }
      };
      if (onlyLatestVersion)        {packageMatchQuery.has_parent.query.bool.must.push({term: { latest_version: 1 }});}

      topicFilter.push(packageMatchQuery);
    }

    return es.search({
      index: 'rdoc',
      body: {
        query: {
          bool: {
            should: [
              {
                bool: {
                  filter: topicFilter,
                  should: [
                    searchTopicQuery,
                    prefixQuery,
                    {
                      has_parent: {
                        parent_type: 'package_version',
                        score_mode: 'score',

                        query: {
                          'has_parent': {
                            'parent_type': 'package',
                            'score_mode': 'score',
                            'query': {
                              'function_score': {
                                'functions': [
                                  {
                                    'filter': { 'missing': { 'field': 'part_of_r' } },
                                    'field_value_factor': {
                                      'field': 'last_month_downloads',
                                      'modifier': 'log1p'
                                    }
                                  },
                                  {
                                    'filter': { 'term': { 'part_of_r': 0 } },
                                    'field_value_factor': {
                                      'field': 'last_month_downloads',
                                      'modifier': 'log1p'
                                    }
                                  },
                                  {
                                    'filter': { 'term': { 'part_of_r': 1 } },
                                    'field_value_factor': {
                                      'field': 'part_of_r',
                                      'modifier': 'log1p',
                                      'factor': 300000
                                    }
                                  }
                                ],
                                'boost_mode': 'replace'
                              }
                            }
                          }
                        },
                        inner_hits: { fields: ['package_name', 'version', 'latest_version', 'maintainer.name'] }
                      }
                    }
                  ],
                  minimum_should_match: 2
                }
              }],
            minimum_should_match: 1
          }
        },
        highlight: {
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
          'fields': {
            'description': {
              'number_of_fragments': 0,
              highlight_query: searchTopicQuery
            },
            'title': {
              'number_of_fragments': 0,
              highlight_query: searchTopicQuery}
          }
        },
        from: offset,
        size: perPage,
        fields: ['package_name', 'version', 'name', 'maintainer.name', 'description', 'title']
      }
    }).then(function(result) {
      var functions  = [];
      result.hits.hits.forEach(function(hit) {
        var fields = {};
        var inner_hits_fields = hit.inner_hits.package_version.hits.hits[0].fields;
        fields.package_name = inner_hits_fields.package_name[0];
        fields.version = inner_hits_fields.version[0];
        fields.name = hit.fields.name[0];
        fields.maintainer = inner_hits_fields['maintainer.name'][0];

        var highlights = _.mapValues(hit.highlight, function(highlight) {
          return striptags(highlight.toString(), '<mark>');
        });

        var description = highlights.description || hit.fields.description[0];
        var title = highlights.title || hit.fields.title[0];

        functions.push({
          fields: fields,
          score: hit._score,
          description: description,
          title: title
        });
      });
      res.locals.layout = null;
      if (req.headers.accept === 'application/json') {
        return res.json({
          functions: functions, hits: result.hits.total
        });
      }
      return res.view('search/function_results.ejs', {data: {functions: functions, hits: numeral(result.hits.total).format('0,0')}});
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },


  fullSearch: function(req, res) {
    return res.redirect(302, "https://rdocumentation.org/search?q=" + req.param('q'));
  }

};
