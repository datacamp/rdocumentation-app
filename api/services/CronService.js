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
    ElasticSearchService.lastMonthDownloadsBulk().then(function (hits){
      console.log('found '+hits)
      var totalhits = hits.total;
    })
  }
};

getSplittedDownloadCounts = function (hits) {
      console.log(hits);
      directDownloads= {};
      indirectDownloads = {};
      var indirect = false;
      hits.forEach(function(hit,i) {
        indirect = false;
        sequelize.query("SELECT DISTINCT b.package_name FROM rdoc.Dependencies a,rdoc.PackageVersions b WHERE a.dependency_name = :name and a.dependant_version_id=b.id",
                        { replacements: { name: hit.fields.package[0] }, type: sequelize.QueryTypes.SELECT }
                        ).then(function(rootPackages){
                          rootPackageNames = _.map(rootPackages,function(package){
                              return package.package_name;
                          });
                          j=i+1;
                          while (j<hits.length && hits[j].fields.ip_id == hit.fields.ip_id
                            && new Date(hits[j].fields.datetime[0]).getTime()< (new Date(hit.fields.datetime[0]).getTime()+60000)){
                            if(_.includes(rootPackageNames,hits[j].fields.package))
                            {
                               indirectDownloads[hits.fields.package] = indirectDownloads[hit.fields.package]+1 || 1;
                               indirect = true;
                               break;
                            }
                            j+=1;
                            console.log ('testing date ' + hits[j].fields.datetime[0])
                          }
                          j=i-1;
                          while (j>=0 && hits[j].fields.ip_id == hit.fields.ip_id
                            && new Date(hits[j].fields.datetime[0]).getTime()+60000> (new Date(hit.fields.datetime[0]).getTime())
                            && !(indirect)){
                            if(_.includes(rootPackageNames,hits[j].fields.package))
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
      return [directDownloads,indirectDownloads]
    };
    writeSplittedDownloadCounts= function(counts){
      var directDownloads = counts[0];
      var indirectDownloads = counts[1];
      return Package.findAll({
        attributes: ['name']
      }).then(function(packages) {
        var records = _.map(packages, function(package) {
          console.log( "updating : " +package.name + ", direct downloads : " + directDownloads[package.name] +"indirect downloads" + indirectDownloads[package.name])
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

