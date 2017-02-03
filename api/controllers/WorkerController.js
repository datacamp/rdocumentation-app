/**
 * WorkerController
 *
 * @description :: Server-side logic for managing Workercontrollers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */


var Promise = require('bluebird');
var _ = require('lodash');

module.exports = {

  processMessage: function(req, res) {
    var type = req.headers['x-aws-sqsd-attr-type'];
    var body =  req.body;

    if (type === 'topic') {
      var packageName = req.body.package.package;
      var packageVersion = req.body.package.version;
      var result = Topic.createWithRdFile({input: req.body, packageName: packageName, packageVersion: packageVersion});
      result.then(function(value) {
        var key = 'view_topic_' + value.id;
        RedisService.del(key);
        res.json(value);
      })
      .catch(Sequelize.UniqueConstraintError, function (err) {
        return res.send(409, err.errors);
      }).catch(Sequelize.ValidationError, function (err) {
        return res.send(400, err.errors);
      }).catch(function(err){
          return res.negotiate(err.errors);
      });

    } else if (type === 'version') {
      return sails.controllers.packageversion.postDescription(req, res);
    } else {
      res.send(400, 'Invalid type');
    }
  },

  indexStats: function(req, res) {
    CronService.indexAggregatedDownloadStats().then(function(result) {
      console.log("Finished indexing stats");
      res.send(200, "done");
    }).catch(function(err){
      return res.negotiate(err.errors);
    });
  },

  updatePercentile: function(req, res) {
    ElasticSearchService.updateLastMonthPercentiles().then(function(){
      console.log("Finished updating percentiles");
      res.send(200, "done");
    }).catch(function(err){
      return res.negotiate(err.errors);
    });
  },

  lastDaySplittedDownloads: function(req, res) {
    DownloadStatistic.getNotIndexedDates().then(function(days) {
      return days.map(function(day) {
        var date = new Date(day.absents);
        var now = new Date();
        return Utils.dateDiffInDays(date, now);
      });
    }).then(function(diffs) {
      if (diffs.length <= 0) {
        console.log("Nothing new");
        return res.send(200, "done");
      }
      res.send(200, "scheduled");
      DownloadStatsService.reverseDependenciesCache = {}; //clean old cache
      return Promise.map(diffs, function (nDay) {
        console.log("Started indexing for today - " + nDay + "days");
        return CronService.splittedAggregatedDownloadstats(nDay)
          .catch({message: "empty"}, function() {
            console.log("No stats for this time range yet");
            return 1;
          })
          .catch(function(err) {
            console.log("Undefined response");
            return 1;
          });
      }, {concurrency: 1})
      .then(function (result) {
        console.log("Finished indexing splitted stats");
        DownloadStatsService.reverseDependenciesCache = {}; //clean cache
      }).catch(function(err) {
        return res.negotiate(err);
      });

    });

  }

};

