// CronService.js - in api/services

/**
* All async tasks
*/

var Promise = require('bluebird');

module.exports = {

  splittedAggregatedDownloadstats :function(day,callback){
    console.log('Started splitted aggregated download count');
    return Promise.promisify(DownloadStatsService.getDailyDownloads)(day);
  },

};


