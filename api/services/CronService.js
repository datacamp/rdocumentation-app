// CronService.js - in api/services

/**
* All async tasks
*/

var _ = require('lodash');
var Promise = require('bluebird');


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
    ElasticSearchService.dailyDownloadsBulk(days,callback);
   }
};


