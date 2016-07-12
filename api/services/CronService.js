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

  splittedAggregatedDownloadstats :function(){
    console.log('Started splitted aggregated download count');
    return ElasticSearchService.lastWeekStats().then(writeSplittedDownloadCounts(hits));

  }

};

writeSplittedDownloadCounts = function (hits) {
      directDownloads= {};
      indirectDownloads = {};
      var indirect = false;
      hits.forEach(function(hit,i) {
        indirect = false;
        sequelize.query("SELECT DISTINCT b.package_name FROM rdoc.Dependencies a,rdoc.PackageVersions b WHERE a.dependency_name = :name and a.dependant_version_id=b.id",
                        { replacements: { name: hit.fields.package }, type: sequelize.QueryTypes.SELECT }
                        ).then(function(rootPackages){
                          j=i+1;
                          while (hits[j].fields.ip_id = hit.fields.ip_id
                            && Date.parse(hits[j].fields.datetime).getTime()< (Date.parse(hit.fields.datetime).getTime()+60000)){
                            if(_.includes(rootPackages,hits[j].fields.package))
                            {
                               indirectDownloads[hits.fields.package] = indirectDownloads[hit.fields.package]+1 || 1;
                               indirect = true;
                               break;
                            }
                            j+=1;
                          }
                          j=i-1;
                          while (hits[j].fields.ip_id = hit.fields.ip_id
                            && Date.parse(hits[j].fields.datetime).getTime()+60000> (Date.parse(hit.fields.datetime).getTime())
                            && !(indirect)){
                            if(_.includes(rootPackages,hits[j].fields.package))
                            {
                               indirectDownloads[hit.fields.package] = indirectDownloads[hit.fields.package]+1 || 1;
                               indirect = true;
                               break;
                            }
                            j-=1;
                          }
                          if(!indirect){
                            directDownloads[hit.fields.package] = directDownloads[hit.fields.package]+1 || 1;
                          }
                        })
          });
      return Package.findAll({
        attributes: ['name']
      }).then(function(packages) {
        var records = _.map(packages, function(package) {
          return {
            package_name: package.name,
            last_month_downloads_direct: directDownloads[package.name] || 0,
            last_month_downloads_indirect:indirectDownloads[package.name] || 0
          };
        });

        var groups = _.chunk(records, 500);

        return Promise.map(groups, function(group) {
          return DownloadStatistic.bulkCreate(group, {
            updateOnDuplicate:true,
          });
        }, {concurrency: 1});
      });
    };

