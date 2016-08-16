// CronService.js - in api/services

/**
* All async tasks
*/

var _ = require('lodash');
var Promise = require('bluebird');
var http = require('http');


module.exports = {

  //We need aggregated download stats in elasticsearch to be able to rescore the search result based on popularity
  indexAggregatedDownloadStats: function() {
    console.log('Started index aggregate stats job');
    //Get aggregated data
    return ElasticSearchService.lastMonthDownloadCount().then(function (buckets) {

      var stats = _.reduce(buckets, function(acc, bucket) {
        acc[bucket.key] = bucket.download_count.value;
        return acc;
      }, {});


      return Package.findAll({
        attributes: ['name']
      }).then(function(packages) {
        var records = _.map(packages, function(package) {
          return {
            package_name: package.name,
            last_month_downloads: stats[package.name] || 0
          };
        });

        var groups = _.chunk(records, 500);

        return Promise.map(groups, function(group) {
          return DownloadStatistic.bulkCreate(group, {
            updateOnDuplicate:true,
          });
        }, {concurrency: 1});
      });


    });

  },

  splittedAggregatedDownloadstats :function(days,callback){
    console.log('Started splitted aggregated download count');
    return Promise.promisify(ElasticSearchService.dailyDownloadsBulk)(days);
  },
  biocSplittedAggregatedDownloadstats :function(months,callback){
    console.log('Started Bioconuctor splitted aggregated download count');
    //stats from n months ago
    var reference = new Date();
    reference.setMonth(reference.getMonth()-months)
    url="http://www.bioconductor.org/packages/stats/bioc/bioc_pkg_stats.tab"
    return Package.getAllNamesOfType(2).then(function(packages){
      return new Promise((resolve, reject) => {
        http.get(url, response => {
          var body = ""
          response.on('data', function (chunk) {
            body = body + chunk;
          });
          response.on('end',function(){
            records = body.split('\n')
            promises = []
            records = _.map(records,function(record){
              splitRecord = record.split('\t')
              if(splitRecord.length == 5 && packages.indexOf(splitRecord[0])>-1 && splitRecord[3] != "all"){
                date = new Date(parseInt(splitRecord[1]),_getIndexOfMonth(splitRecord[2]),1)
                if(date >reference){
                  return {
                    package_name:splitRecord[0],date : date,distinct_ips:parseInt(splitRecord[3]),downloads:parseInt([splitRecord[4]])
                  }
                }
                else{
                  return null;
                }
              }
              else{
                return null;
              }
            })
            records = _.filter(records,function(record){
              return (record != null)
            })
            var groups = _.chunk(records, 500);

            Promise.map(groups, function(group) {
              return BiocDownloadStatistics.bulkCreate(group, {
                updateOnDuplicate:true
              });
            }, {concurrency: 1}).then(function(){
              resolve();
            })
          })
        }).on('error', err => {
            reject(err)
        })
      })
    })
  }
};

_getIndexOfMonth= function(month){
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(month);
}


