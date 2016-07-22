var _ = require('lodash');
var Promise = require('bluebird');
var dateFormat = require('dateformat');

module.exports = {

  reverseDependenciesCache: {

  },

  getReverseDependencies: function(package_name) {
    var reverseDependencies = DownloadStatsService.reverseDependenciesCache[package_name];
    if (reverseDependencies) {
      return Promise.resolve(reverseDependencies);
    } else {
      return Dependency.findByDependantForIndependentDownloads(package_name).then(function(rootPackages) {
        var rootPackageNames = _.map(rootPackages,function(package){
          return package.package_name;
        });
        rootPackageNames = _.sortBy(rootPackageNames);
        DownloadStatsService.reverseDependenciesCache[package_name] = rootPackageNames;
        return rootPackageNames;
      });
    }
  },

  processDownloads:function(response,directDownloads,indirectDownloads,total,callback) {
    var hits = response.hits.hits;
    var binarySearchIncludes = function (haystack, needle) {
      return _.sortedIndexOf(haystack, needle) !== -1 ;
    };

    Promise.map(hits, function(hit, i) {
      //execute queries to find inverse dependencies for all hits asynchronous, and find indirect hits before and after in ordered records
      var package_name = hit.fields.package[0];
      return DownloadStatsService.getReverseDependencies(package_name).then(function(rootPackageNames) {

        indirect = false;
        j=i+1;
        while (!indirect && j<hits.length && hits[j].fields.ip_id[0] == hit.fields.ip_id[0] &&
          new Date(hits[j].fields.datetime[0]).getTime()< (new Date(hit.fields.datetime[0]).getTime()+60000)
        ) {
          if(binarySearchIncludes(rootPackageNames,hits[j].fields.package[0])) {
            indirectDownloads[package_name] = indirectDownloads[package_name]+1 || 1;
            indirect=true;
          }
          j+=1;
        }
        j=i-1;
        while (j>=0 && hits[j].fields.ip_id[0] == hit.fields.ip_id[0] &&
          new Date(hits[j].fields.datetime[0]).getTime()+60000> (new Date(hit.fields.datetime[0]).getTime()) &&
          !(indirect)
        ) {
          if(binarySearchIncludes(rootPackageNames,hits[j].fields.package[0])) {
            indirectDownloads[package_name] = indirectDownloads[package_name]+1 || 1;
            indirect=true;
          }
          j-=1;
        }
        if(!indirect){
          directDownloads[package_name] = directDownloads[package_name]+1 || 1;
        }
      });

    }, {concurrency: 10}).then(function(){
      dateBadFormat = new Date(date=hits[1].fields.datetime[0]);
      date = dateFormat(dateBadFormat, "yyyy-mm-dd").toString();
      return ElasticSearchService.scrollDailyDownloadsBulk(response,date,directDownloads,indirectDownloads,total,callback);
    });
  },

  //write all splitted download counts to the database
  writeSplittedDownloadCounts: function(date,directDownloads,indirectDownloads){
    console.log("writing data");
    return Package.findAll({attributes: ['name']}).then(function(packages) {
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
