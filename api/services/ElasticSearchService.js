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
      lastMonthDownloads: function(n){
        return {
          "size": "10000",
          "fields": ["datetime","ip_id","package","version"],
          "sort": [
            {"ip_id":{"order":"asc","ignore_unmapped" : true}},
            {"datetime":{"order":"asc","ignore_unmapped" : true}}
          ],
          "query":{
            "bool": {
              "filter": [
                {
                  "term": { "_type": "stats" }
                },
                {
                  "range": {
                    "datetime":  {
                      "gte" : "now-"+(n)+"d/d",
                      "lt" :  "now-"+(n-1)+"d/d"
                    }
                  }
                }
              ]
            }
          }

        };
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

  //download first 10000 results and proceed by processing and scrolling
  dailyDownloadsBulk:function(days, callback){
    var body = ElasticSearchService.queries.filters.lastMonthDownloads(days);
    if (days < 1) return Promise.resolve("Nothing to do");

    return es.search({
      scroll:'5M',
      index: 'stats',
      body: body,
    }, function processAndGetMore(error,response){
      //check the response
      if (typeof response === "undefined") {
        var err ="you received an undefined response, response:"+response+
        "\n this was probably caused because there were no stats yet for this day"+
        "\n or processing time took over 5 minutes (the scroll interval";
        callback(err);
      } else if (response.hits.total === 0) { return callback({message: "empty"}); }
      else DownloadStatsService.processDownloads(response,{},{},10000,callback);
    });
  },

  //scroll further in search result, when response already contains a scroll id
  scrollDailyDownloadsBulk: function(response,date,directDownloads,indirectDownloads,total,callback) {
    console.log("processing next 10000 records");
    if (response.hits.total > total) {
      // now we can call scroll over and over
      es.scroll({
        scrollId: response._scroll_id,
        scroll: '5M'
      }, function processScroll(error,response){
        if (typeof response == "undefined" || typeof response.hits == "undefined") {
          var err ="you received an undefined response, response:"+response+
          "\n this was probably caused because there were no stats yet for this day"+
          "\n or processing time took over 5 minutes (the scroll interval";
          callback(err);
        }
        return DownloadStatsService.processDownloads(response,directDownloads,indirectDownloads,total+10000,callback);
      });
    } else {
      //write the responses to the database when done
      DownloadStatsService.writeSplittedDownloadCounts(date,directDownloads,indirectDownloads).then(function(result){
        callback(null,result);
      });
    }
  }
};
