// SearchService.js - in api/services
var _ = require('lodash');
var percentile = require('percentile');
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
            "percents": _.range(1.0000000001, 100, 1).concat([99.5, 99.9, 99.99])

        }
      },
      all_downloads_last_month: {
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
                    "range": {
                      "datetime": {
                        "gte": "now-1M",
                        "lte": "now",
                        "format": "epoch_millis"
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
          "package": {
            "terms": {
              "field": "package",
              "size" : 1000000
              }
          }
        }
      },
      "last_month_per_day": {
          "date_histogram" : {
              "field" : "datetime",
              "interval" : "day"
          }
      },
       lastMonthTrends: function(n){
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
                            "gte": "now-"+(30+n)+"d/d",
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
                    "min": "now-"+(30+n)+"d/d",
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
        },
      lastMonthMostDownloaded: {
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
                    "range": {
                      "datetime": {
                        "gte": "now-1M",
                        "lte": "now",
                        "format": "epoch_millis"
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
          "package": {
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

  lastMonthMostDownloaded: function() {
    var body = ElasticSearchService.queries.aggregations.lastMonthMostDownloaded;
    return es.search({
      index: 'stats',
      body: body
    }).then(function(result){
      return result.aggregations.package.buckets;
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

  lastMonthPerDayTrending: function() {
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
        body = ElasticSearchService.queries.aggregations.lastMonthTrends(1);
      }
      else{
        body = ElasticSearchService.queries.aggregations.lastMonthTrends(0);
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


  helpSearchQuery:function(pattern,fields,fuzzy,max_dist){
    var highlighting = false;
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
      if(fields.indexOf("aliases")>-1){
        t["body"]["highlight"] = {
          "fields" : {
            "aliases": {
               "number_of_fragments" : 0,
               highlight_query: {
               match: {
                  aliases: {
                    query : pattern,
                    fuzziness : max_dist
                  }
                }
              }
            }
          }
        }
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
            var alias = record.fields.aliases[0]
            if(highlighting){
              alias = striptags(record.highlight.aliases.toString(),'<em>')
            }
            return {
              id : record._id,
              package_name : record.inner_hits.package_version.hits.hits[0].fields.package_name[0],
              package_version : record.inner_hits.package_version.hits.hits[0].fields.version[0],
              function_name : record.fields.name[0],
              function_alias : alias,
              function_description : record.fields.description[0]
            };
          });
        }
      })
      .catch(function(err){
        console.log(err.message);
      });
  }
};
