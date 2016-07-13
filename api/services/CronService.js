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
    ElasticSearchService.lastMonthDownloadsBulk();
   },

  processDownloads:function(response,directDownloads,indirectDownloads,total){
    console.log("response :"+response);
    var hits = response.hits.hits;
    var promises = []
    //console.log(hits);
    hits.forEach(function(hit,i) {
        //console.log(hit);
        //console.log(hit.fields.package[0]);
        indirect = false;
        promises.push(sequelize.query("SELECT DISTINCT b.package_name FROM rdoc.Dependencies a,rdoc.PackageVersions b WHERE a.dependency_name = :name and a.dependant_version_id=b.id",
                        { replacements: { name: hit.fields.package[0] }, type: sequelize.QueryTypes.SELECT }
                        ));
        promises[promises.length-1].then(function(rootPackages){
                          rootPackageNames = _.map(rootPackages,function(package){
                              return package.package_name;
                          });
                          j=i+1;
                          //console.log("first test:" +j<hits.length);
                          //console.log("second test:"+ hits[j].fields.ip_id[0] == hit.fields.ip_id[0]);
                          //console.log("third test :"+new Date(hits[j].fields.datetime[0]).getTime()< (new Date(hit.fields.datetime[0]).getTime()+60000));
                          while (j<hits.length && hits[j].fields.ip_id[0] == hit.fields.ip_id[0]
                            && new Date(hits[j].fields.datetime[0]).getTime()< (new Date(hit.fields.datetime[0]).getTime()+60000)){
                            //console.log("in while");
                            if(_.includes(rootPackageNames,hits[j].fields.package[0]))
                            {
                               //console.log("indirect download for " + hit.fields.package[0]);
                               //console.log("fields "+ hit.fields.package);
                               //console.log("ip_id " + hit.fields.ip_id);
                               indirectDownloads[hit.fields.package[0]] = indirectDownloads[hit.fields.package[0]]+1 || 1;
                               indirect = true;
                               break;
                            }
                            j+=1;
                            //console.log ('testing date ' + hits[j].fields.datetime[0])
                          }
                          j=i-1;
                          while (j>=0 && hits[j].fields.ip_id[0] == hit.fields.ip_id[0]
                            && new Date(hits[j].fields.datetime[0]).getTime()+60000> (new Date(hit.fields.datetime[0]).getTime())
                            && !(indirect)){
                            //console.log("in while");
                            if(_.includes(rootPackageNames,hits[j].fields.package))
                            {
                               //console.log("indirect download for " + hit.fields.package[0]);
                               //console.log("pacakge: "+hit.fields.package);
                               //console.log("ip_id " + hit.fields.ip_id);
                               indirectDownloads[hit.fields.package[0]] = indirectDownloads[hit.fields.package[0]]+1 || 1;
                               indirect = true;
                               break;
                            }
                            j-=1;
                          }
                          if(!indirect){
                            //console.log("direct download for " + hit.fields.package[0]);
                            directDownloads[hit.fields.package[0]] = directDownloads[hit.fields.package[0]]+1 || 1;
                          }
                        })
          });
        Promise.all(promises).then(function(){
          console.log("example: "+directDownloads["labeling"]);
          return ElasticSearchService.scrollLastMonthDownloadsBulk(response,directDownloads,indirectDownloads,total);
        });

  },
  writeSplittedDownloadCounts: function(directDownloads,indirectDownloads){
    console.log("example: "+directDownloads["labeling"]);
      return Package.findAll({
        attributes: ['name']
      }).then(function(packages) {
        var records = _.map(packages, function(package) {
          var totalDownloads = directDownloads[package.name]+indirectDownloads[package.name] || directDownloads[package.name] || indirectDownloads[package.name] || 0;
          //console.log( "updating : " +package.name + ", direct downloads : " + directDownloads[package.name] +"indirect downloads" + indirectDownloads[package.name])
          return {
            package_name: package.name,
            last_month_downloads: totalDownloads,
            last_month_downloads_indirect: indirectDownloads[package.name] || 0,
            last_month_downloads_direct: directDownloads[package.name] || 0
          };
        });
        var groups = _.chunk(records,10);

        return Promise.map(groups, function(group) {
          console.log(group);
          return DownloadStatistic.bulkCreate(group, {
            updateOnDuplicate:true,
            validate:true
          });
        }, {concurrency: 1});
      });
    }
};

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
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
                               console.log("indirect download for " + indirectDownloads[hit.fields.package]);
                               indirectDownloads[hit.fields.package] = indirectDownloads[hit.fields.package]+1 || 1;
                               indirect = true;
                               break;
                            }
                            j-=1;
                          }
                          if(!indirect){
                            console.log("direct download for " + directDownloads[hit.fields.package]);
                            directDownloads[hit.fields.package] = directDownloads[hit.fields.package]+1 || 1;
                          }
                        })
          });
      return [directDownloads,indirectDownloads]
    };


