// CronService.js - in api/services

/**
* All async tasks
*/

var _ = require('lodash');
var Promise = require('bluebird');
var dateFormat = require('dateformat');


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
    ElasticSearchService.lastMonthDownloadsBulk(days,callback);
   },

  processDownloads:function(response,directDownloads,indirectDownloads,total,callback){
    //check the response
    if (typeof response.hits != "undefined") {    
      var hits = response.hits.hits;
      var promises = [];
    }
    else{
      console.log("you received an undefined response, response:"+response);
      console.log("this was probably caused because there were no stats yet for this day");
      console.log("or processing time took over 5 minutes (the scroll interval");
      callback();
    }    
    //loop over all hits
    hits.forEach(function(hit,i) {
        //execute queries to find inverse dependencies for all hits asynchronous, and find indirect hits before and after in ordered records
        promises.push(Dependency.findByDependantForIndependentDownloads(hit.fields.package[0]));
        promises[promises.length-1].then(function(rootPackages){
                          rootPackageNames = _.map(rootPackages,function(package){
                              return package.package_name;
                          });
                          indirect = false;
                          j=i+1;
                          while (!indirect && j<hits.length && hits[j].fields.ip_id[0] == hit.fields.ip_id[0]
                            && new Date(hits[j].fields.datetime[0]).getTime()< (new Date(hit.fields.datetime[0]).getTime()+60000)){
                            if(_.includes(rootPackageNames,hits[j].fields.package[0]))
                            {
                              indirectDownloads[hit.fields.package[0]] = indirectDownloads[hit.fields.package[0]]+1 || 1;
                              indirect=true;
                            }
                            j+=1;
                          }
                          j=i-1;
                          while (j>=0 && hits[j].fields.ip_id[0] == hit.fields.ip_id[0]
                            && new Date(hits[j].fields.datetime[0]).getTime()+60000> (new Date(hit.fields.datetime[0]).getTime())
                            && !(indirect)){
                            if(_.includes(rootPackageNames,hits[j].fields.package[0]))
                            {
                              indirectDownloads[hit.fields.package[0]] = indirectDownloads[hit.fields.package[0]]+1 || 1;
                              indirect=true;
                            }
                            j-=1;
                          }
                          if(!indirect){
                            directDownloads[hit.fields.package[0]] = directDownloads[hit.fields.package[0]]+1 || 1;
                          }
                        })                    
          });
        //when all promises are resolved, proceed and scroll search results
        Promise.all(promises).then(function(){
          dateBadFormat = new Date(date=hits[1].fields.datetime[0])
          date = dateFormat(dateBadFormat,"yyyy-mm-dd").toString();
          return ElasticSearchService.scrollLastMonthDownloadsBulk(response,date,directDownloads,indirectDownloads,total,callback);
        });

  },
  //write all splitted download counts to the database
  writeSplittedDownloadCounts: function(date,directDownloads,indirectDownloads){
      console.log("writing data");
      return Package.findAll({
        attributes: ['name']
      }).then(function(packages) {
        var records = _.map(packages, function(package) {
          return {
            package_name: package.name,
            date: date,
            indirect_downloads: indirectDownloads[package.name] || 0,
            direct_downloads: directDownloads[package.name] || 0
          };
        });
        var groups = _.chunk(records,500);

        return Promise.map(groups, function(group) {
          return DownloadStatistic.bulkCreate(group, {
            updateOnDuplicate:true
          });
        }, {concurrency: 1});
      });
    }
};


