// SearchService.js - in api/services
var _ = require('lodash');
module.exports = {

  DAILY: 86400,

  queries: {
    aggregations: {
      download_per_package : {
        "terms" : { "field" : "package", "size" : 10000 }, //calculate percentile over all packages
        "aggs" : {
            "download_count" : { "value_count" : { "field" : "package" } }
        }
      },
      download_percentiles: {
        "percentiles_bucket": {
            "buckets_path": "download_per_package>download_count",
            "percents": [ 1.00001, // 0.0001, hack to avoid javascript to turn 1.0 into 1, which does not work because of elasticsearch coercion system
              5.00001,
              10.00001,
              20.00001,
              30.00001,
              40.00001,
              50.00001,
              60.00001,
              70.00001,
              80.00001,
              90.00001,
              95.00001,
              99.00001,
              99.5,
              99.9,
              99.99
            ]

        }
      }
    },
    filters: {
      lastMonthStats: {
        "bool": {
          "filter": [
            {
                "term": { "_type": "stats" }
            },
            {
              "range": {
                  "datetime":  {
                      "gte" : "now-1M/d",
                      "lt" :  "now/d"
                  }
              }
            }
          ]
        }
      }
    }
  },

  lastMonthPercentiles: function() {
    var body = {
      "query": ElasticSearchService.queries.filters.lastMonthStats,
      "size": 0, // do not retrieve data, we are only interested in aggregation data
      "aggs" : ElasticSearchService.queries.aggregations
    };

    return es.search({
      index: 'rdoc',
      requestCache: true, //cache the result
      body: body
    }).then(function(response) {
      return response.aggregations.download_percentiles.values;
    });

  },

  lastMonthDownloadCount: function() {
    var body = {
      "query": ElasticSearchService.queries.filters.lastMonthStats,
      "size": 0, // do not retrieve data, we are only interested in aggregation data
      "aggs" : {
        download_per_package: ElasticSearchService.queries.aggregations.download_per_package
      }
    };

    return es.search({
      index: 'rdoc',
      requestCache: true, //cache the result
      body: body
    }).then(function(response) {
      return response.aggregations.download_per_package.buckets;
    });

  },

  cachedLastMonthPercentiles: function( ) {
    return RedisService.getJSONFromCache('percentiles', RedisService.DAILY, function() {
      return ElasticSearchService.lastMonthPercentiles();
    });
  }


};
