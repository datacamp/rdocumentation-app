// CronService.js - in api/services

/**
* All async tasks
*/

var Promise = require('bluebird');

module.exports = {

  indexDownloadCounts: function () {
    return DownloadStatistic.getNotIndexedDates().then(function (days) {
      return days.map(function (day) {
        var date = new Date(day.absents);
        return date;
      });
    }).then(function (diffs) {
      if (diffs.length <= 0) {
        console.log("Nothing new");
        return res.send(200, "done");
      }
      DownloadStatsService.reverseDependenciesCache = {}; //clean old cache
      return Promise.map(diffs, function (day) {
        console.log(`Started indexing for ${day}.`);
        return Promise.promisify(DownloadStatsService.getDailyDownloads)(day)
          .catch({ message: "empty" }, function () {
            console.log("No stats for this time range yet");
            return 1;
          })
          .catch(function (err) {
            console.log("Undefined response");
            return 1;
          });
      }, { concurrency: 1 })
        .then(function (result) {
          console.log("Finished indexing splitted stats");
          DownloadStatsService.reverseDependenciesCache = {}; //clean cache
        })

    }).catch(function (err) {
      console.error(err);
    });

  },

  updatePercentile: function () {
    return DownloadStatsService.updateLastMonthPercentiles().then(function () {
      console.log("Finished updating percentiles");
    }).catch(function (err) {
      console.error(err);
    });
  }

};


