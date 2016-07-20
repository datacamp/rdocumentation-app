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
      },
       lastWeekTrends: function(n){
        return {
            "query": {
              "filtered": {
                "query": {
                  "query_string": {
                    "query": "*",
                    "analyze_wildcard": true
                  }
                },
                "filter": {
                  "bool": {
                    "must": [
                      {
                        "query": {
                          "query_string": {
                            "analyze_wildcard": true,
                            "query": "*"
                          }
                        }
                      },
                      {
                        "range": {
                          "datetime": {
                            "gte": "now-"+(7+n)+"d/d",
                            "lte": "now-"+(1+n)+"d/d"
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            "size": 0,
            "aggs": {
              "lastweek": {
                "date_histogram": {
                  "field": "datetime",
                  "interval": "1d",
                  "min_doc_count": 1,
                  "extended_bounds": {
                    "min": "now-"+(7+n)+"d/d",
                    "max": "now-"+(1+n)+"d/d"
                  }
                },
                "aggs": {
                  "day": {
                    "terms": {
                      "field": "package",
                      "size": 10,
                      "order": {
                        "_count": "desc"
                      }
                    }
                  }
                }
              }
            }
          };
        },
        topKeywords: {
          "query": {
            "filtered": {
              "query": {
                "query_string": {
                  "analyze_wildcard": true,
                  "query": "*"
                }
              },
              "filter": {
                "bool": {
                  "must": [
                    {
                      "query": {
                        "query_string": {
                          "query": "*",
                          "analyze_wildcard": true
                        }
                      }
                    }
                  ],
                  "must_not": []
                }
              }
            }
          },
          "size": 0,
          "aggs": {
            "top": {
              "terms": {
                "field": "keywords",
                "size": 20,
                "order": {
                  "_count": "desc"
                }
              }
            }
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
                      "gte" : "now-1y/d",
                      "lt" :  "now/d"
                  }
              }
            }
          ]
        }
      },
      lastDaysStats:function(day){
        return {
          "bool": {
            "filter": [
              {
                  "term": { "_type": "stats" },
              },
              {
                "range": {
                    "datetime":  {
                        "gte" : "now-"+day+"d/d",
                        "lt" :  "now/d"
                    }
                }
              }
            ]
          }
        }
      },
      lastMonthDownloads: function(n){
        return {
          "size": "10000",
          "fields": ["datetime","ip_id","package"],
          "sort": [
            {"ip_id":{"order":"asc","ignore_unmapped" : true}},
            {"datetime":{"order":"asc","ignore_unmapped" : true}}
          ],
          "query":{
            "bool": {
              "filter": [
                {
                  "term": { "_type": "stats" },
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
  lastDaysPerDay: function(packageName,days) {
    var lastMonthPackageFilter =  ElasticSearchService.queries.filters.lastDaysStats(days);
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

  lastWeekPerDayTrending: function() {
    var query = {
      "query": ElasticSearchService.queries.filters.lastDaysStats(1),
      size: 0
    };
    return es.search({
      index: "stats",
      body: query
    }).then(function(lastDay){
      var body;
      if(lastDay.hits.total ==0){
        body = ElasticSearchService.queries.aggregations.lastWeekTrends(1);
      }
      else{
        body = ElasticSearchService.queries.aggregations.lastWeekTrends(0);
      }
      return es.search({
        body: body
      }).then(function(response) {
        return response.aggregations.lastweek.buckets;
      });

    });
  },
  topKeywords: function() {
    return es.search({
      index: "rdoc",
      body: ElasticSearchService.queries.aggregations.topKeywords
    }).then(function(keywords){
      return keywords.aggregations.top.buckets;
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
      } else if (typeof response.hits === "undefined" || response.hits.total === 0) { return callback({message: "empty"}); }
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
  },
  helpSearchQuery:function(pattern,fields,fuzzy,max_dist){
    var t = {}
    t["index"] = "rdoc";
    t["body"] = {
      "query":{
        "bool":{
          "filter":[
            {
              "type":
              {
                "value":"topic"
              }
            },
            {
              "has_parent":
              {
                "parent_type" : "package_version",
                "query":{
                  "term":{
                    "latest_version":1
                  }
                },
                "inner_hits": { "fields" : ["package_name","version","latest_version"]}
              }
            }
          ],"should":
          [
            {},
            {
              "has_parent":
              {
                "score_mode":"score",
                "parent_type":"package_version",
                "query":
                {
                  "has_parent":{
                    "query":{
                      "function_score":{
                        "functions":[
                          {
                            "filter": {"missing":{"field":"part_of_r"}},
                            "field_value_factor":
                            {
                              "field":"last_month_downloads",
                              "modifier":"log1p"
                            }
                          },
                          {
                            "filter": { "exists" : { "field" : "part_of_r" } },
                            "field_value_factor":
                            {
                              "field":    "part_of_r",
                              "modifier": "log1p",
                              "factor": 300000
                            }
                          }
                        ],
                        "boost_mode": "replace"
                      }
                    },
                    "parent_type" : "package",
                    "score_mode" : "score"
                  }
                }
              }
            }
          ],"minimum_number_should_match": 1
        }
      },
      "size":10,
      "fields": ["package_name", "version", "name","aliases","description"]
    }
    if(fuzzy){
      t["body"]["query"]["bool"]["should"][0]["multi_match"] = {
        "query":pattern,
        "fields":fields,
        "fuzziness":max_dist
      };
      if(_.includes(fields,"concept")){
        t["body"]["query"]["bool"]["should"][0]["query"]={
          "bool":{
            "filter":
            {
              "term":{"sections.name":"concept"}
            },
            "should":
            [
             {
                "match":
                {
                    "sections.description":{
                        "query":pattern,
                        "fuzziness":max_dist
                    }
                }
              }
            ]
          }
        };
      }
    }
    else{
      t["body"]["query"]["bool"]["should"][0]["regexp"]={};
      for(var i = 0;i<fields.length;i++){
        t["body"]["query"]["bool"]["should"][0]["regexp"][fields[i]] = {
          "value":pattern
        };
      }
      if(_.includes(fields,"concept")){
        t["body"]["query"]["bool"]["should"][0]["query"]={
          "bool":{
            "filter":
            {
              "term":{"sections.name":"concept"}
            },
            "should":
            [
             {
                "regexp":
                {
                    "sections.description":{
                        "value":pattern
                    }
                }
            }
           ]
          }
        };
      }
    };
    return es.search(t).then(function(response){
        if(parseInt(response.hits.total) == 0){
          return [];
        }
        else{
          return _.map(response.hits.hits,function(record){
                    return {
                    id:record._id,
                    package_name:record.inner_hits.package_version.hits.hits[0].fields.package_name[0],
                    package_version:record.inner_hits.package_version.hits.hits[0].fields.version[0],
                    function_name:record.fields.name[0],
                    function_alias:record.fields.aliases,
                    function_description:record.fields.description[0]
                    };
            });
        }
      })
      .catch(function(err){
        console.log(err.message);
      });
  } 
};
