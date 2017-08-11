var _ = require('lodash');
var Promise = require('bluebird');
var dateFormat = require('dateformat');
var CSV = require('csv-js');
var r = require('request');
var zlib = require('zlib');

module.exports = {

  reverseDependenciesCache: {

  },

  getReverseDependencies: function(package_name) {
    var reverseDependencies = DownloadStatsService.reverseDependenciesCache[package_name];
    if (reverseDependencies) {
      return Promise.resolve(reverseDependencies);
    } else {
      return Dependency.findByDependantForIndependentDownloads(package_name).then(function(rootPackages) {
        var rootPackageNames = _.map(rootPackages,function(_package){
          return _package.package_name;
        });
        rootPackageNames = _.sortBy(rootPackageNames);
        DownloadStatsService.reverseDependenciesCache[package_name] = rootPackageNames;
        return rootPackageNames;
      });
    }
  },

  binarySearchIncludes: function (haystack, needle) {
    return _.sortedIndexOf(haystack, needle) !== -1 ;
  },

  getDailyDownloads: function (day, callback) {

    var dayDateString = dateFormat(day, "yyyy-mm-dd").toString();
    var url = `http://cran-logs.rstudio.com/${day.getFullYear()}/${dayDateString}.csv.gz`;

    var requestSettings = {
      method: 'GET',
      url,
      encoding: null,
    };

    console.info('Sending request ...');
    r(requestSettings, function(error, response, buf) {
      if(response.statusCode === 404){
         return callback({message: "empty"});
      }
      else if(response.statusCode === 200){
        console.info('Unzipping ...');
        zlib.gunzip(buf, function(err, dezipped) {
          if(err){
            return callback(err);
          }
          console.info('Parsing csv ...');
          var downloads = CSV.parse(dezipped.toString());
          downloads.shift(); // remove header line
          var downloads = _.map(downloads, function(download){
            return {
              date: download[0],
              time: download[1],
              dateTime: new Date(`${download[0]}T${download[1]}Z`),
              package: download[6],
              ip_id: download[9]
            }
          });
          downloads.sort(function(download1, download2){
            return download1.dateTime.getTime - download2.dateTime.getTime;
          });
          DownloadStatsService.processDailyDownloads(day, downloads, callback);
        });
      }
    });


  },

  processDailyDownloads: function(date, downloads, callback) {
    console.info('Processing downloads ...');
    var indirectDownloads = {}; // The value for every key is a set with ip_id's, this will automatically only count unique ip's
    var directDownloads = {};
    Promise.map(downloads, function(download, i) {
      var package_name = download.package;

      function addDownloadTo(hash, download) {
        if(!hash[package_name])
          hash[package_name] = new Set();
        hash[package_name].add(download.ip_id);
      }

      return DownloadStatsService.getReverseDependencies(package_name).then(function(rootPackageNames) {

        var indirect = false;
        var j=i+1;

        var downloadTime = download.dateTime.getTime();

        for(j= i + 1; j < downloads.length; j++) {
          if(indirect || downloads[j].dateTime.getTime() > downloadTime + 60 * 1000)
            break;
          if(downloads[j].ip_id === download.ip_id && DownloadStatsService.binarySearchIncludes(rootPackageNames, downloads[j].package)){
            addDownloadTo(indirectDownloads, download)
            indirect = true;
          }
        }

        for(j= i - 1; j >= 0; j--) {
          if(indirect || downloads[j].dateTime.getTime() < downloadTime - 60 * 1000)
            break;
          if(downloads[j].ip_id === download.ip_id && DownloadStatsService.binarySearchIncludes(rootPackageNames, downloads[j].package)){
            addDownloadTo(indirectDownloads, download)
            indirect = true;
          }
        }

        if(!indirect){
          addDownloadTo(directDownloads, download)
        }
      });
    }, {concurrency: 10})
    .then(function(){
        DownloadStatsService.writeDownloadsToDB(date, directDownloads, indirectDownloads)
        .then(function(result){
          console.info('Downloads written to database!');
          callback(null,result);
        });
    });
  },

  writeDownloadsToDB: function(date,directDownloads,indirectDownloads){
    console.info("Writing data to database ...");
    return Package.findAll({attributes: ['name']}).then(function(packages) {
      var records = _.map(packages, function(_package) {
        return {
          package_name: _package.name,
          date: date,
          indirect_downloads: (indirectDownloads[_package.name] || new Set()).size,
          direct_downloads: (directDownloads[_package.name] || new Set()).size
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
