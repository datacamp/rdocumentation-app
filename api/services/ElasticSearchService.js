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
            "percents": _.range(1.00001, 100, 1).concat([99.5, 99.9, 99.99])

        }
      },
      "last_month_per_day": {
          "date_histogram" : {
              "field" : "datetime",
              "interval" : "day"
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
      },
      lastWeek:{
            "fields":["datetime","ip_id","package"],
            "sort":[ {"ip_id":{"order":"asc","ignore_unmapped" : true}},
                    {"datetime":{"order":"asc","ignore_unmapped" : true}}],
            "query":{
                "bool": {
                      "filter": [
                        {
                            "term": { "_type": "stats" }
                        },
                        {
                          "range": {
                              "datetime":  {
                                  "gte" : "now-1w/d",
                                  "lt" :  "now/d"
                              }
                          }
                        }
                      ]
                      }
                  }
      },
      secondLastWeek:
          {
            "fields":["datetime","ip_id","package"],
            "sort":[ {"ip_id":{"order":"asc","ignore_unmapped" : true}},
                    {"datetime":{"order":"asc","ignore_unmapped" : true}}],
            "query":{
                "bool": {
                      "filter": [
                        {
                            "term": { "_type": "stats" }
                        },
                        {
                          "range": {
                              "datetime":  {
                                  "gte" : "now-2w/d",
                                  "lt" :  "now-1w/d"
                              }
                          }
                        }
                      ]
                      }
                  }
          },
      thirdLastWeek:
          {
            "fields":["datetime","ip_id","package"],
            "sort":[ {"ip_id":{"order":"asc","ignore_unmapped" : true}},
                    {"datetime":{"order":"asc","ignore_unmapped" : true}}],
            "query":{
                "bool": {
                      "filter": [
                        {
                            "term": { "_type": "stats" }
                        },
                        {
                          "range": {
                              "datetime":  {
                                  "gte" : "now-3w/d",
                                  "lt" :  "now-2w/d"
                              }
                          }
                        }
                      ]
                      }
                  }
          },
      restOfMonth:
        {
            "fields":["datetime","ip_id","package"],
            "sort":[ {"ip_id":{"order":"asc","ignore_unmapped" : true}},
                    {"datetime":{"order":"asc","ignore_unmapped" : true}}],
            "query":{
                "bool": {
                      "filter": [
                        {
                            "term": { "_type": "stats" }
                        },
                        {
                          "range": {
                              "datetime":  {
                                  "gte" : "now-1M/d",
                                  "lt" :  "now-3w/d"
                              }
                          }
                        }
                      ]
                      }
                  }
          }
    }
  },
  lastMonthPercentiles: function() {
    var body = {
      "query": ElasticSearchService.queries.filters.lastMonthStats,
      "size": 0, // do not retrieve data, we are only interested in aggregation data
      "aggs" : _.pick(ElasticSearchService.queries.aggregations, ['download_per_package', 'download_percentiles'])
    };

    return es.search({
      index: 'stats',
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
      index: 'stats',
      requestCache: true, //cache the result
      body: body
    }).then(function(response) {
      return response.aggregations.download_per_package.buckets;
    });

  },

  lastMonthPerDay: function(packageName) {
    var lastMonthPackageFilter =  _.cloneDeep(ElasticSearchService.queries.filters.lastMonthStats);
    lastMonthPackageFilter.bool.filter.push({ "term": { "package": packageName } });
    var body = {
      "query": lastMonthPackageFilter,
      "size": 0, // do not retrieve data, we are only interested in aggregation data
      "aggs" : {
        last_month_per_day: ElasticSearchService.queries.aggregations.last_month_per_day
      }
    };

    return es.search({
      index: 'stats',
      requestCache: true, //cache the result,
      body: body
    }).then(function(response) {
      return response.aggregations.last_month_per_day.buckets;
    });
  },

  cachedLastMonthPercentiles: function(res) {
    return RedisService.getJSONFromCache('percentiles', res, RedisService.DAILY, function() {
      return ElasticSearchService.lastMonthPercentiles();
    });
  },

  lastWeekStats:function(){
       var body = {
      "query": ElasticSearchService.queries.filters.lastWeek
      };
      return es.search({
      index: 'stats',
      body: body
      }).then(function(response){
        return response.hits.hits;
      })
  },
  secondLastWeekStats:function(){
       var body = {
      "query": ElasticSearchService.queries.filters.secondLastWeek
      };
      return es.search({
      index: 'stats',
      body: body
      }).then(function(response){
        return response.hits.hits;
      })
  },
  thirdLastWeekStats:function(){
      var body = {
        "query": ElasticSearchService.queries.filters.thirdLastWeek
      };
      return es.search({
        index:'stats',
        body:body
      }).then(function(response){
        return response.hits.hits;
      })
   },
   restOfMonthStats:function(){
       var body = {
      "query": ElasticSearchService.queries.filters.restOfMonth
      };
      return es.search({
      index: 'stats',
      body: body
      }).then(function(response){
        return response.hits.hits;
      })
   }
};
