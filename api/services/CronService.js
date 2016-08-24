// CronService.js - in api/services

/**
* All async tasks
*/

var _ = require('lodash');
var Promise = require('bluebird');
var http = require('http');

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
    return Promise.promisify(ElasticSearchService.dailyDownloadsBulk)(days);
  },

  biocSplittedAggregatedDownloadstats :function(months,callback){
    console.log('Started Bioconuctor splitted aggregated download count');
    //stats from n months ago
    var reference = new Date();
    reference.setMonth(reference.getMonth()-months)
    url="http://www.bioconductor.org/packages/stats/bioc/bioc_pkg_stats.tab"
    return Package.getAllNamesOfType(2).then(function(packages){
      return new Promise((resolve, reject) => {
        http.get(url, response => {
          var body = ""
          response.on('data', function (chunk) {
            body = body + chunk;
          });
          response.on('end',function(){
            records = body.split('\n')
            promises = []
            records = _.map(records,function(record){
              splitRecord = record.split('\t')
              if(splitRecord.length == 5 && packages.indexOf(splitRecord[0])>-1 && splitRecord[3] != "all"){
                date = new Date(parseInt(splitRecord[1]),_getIndexOfMonth(splitRecord[2]),1)
                if(date >reference){
                  return {
                    package_name:splitRecord[0],date : date,distinct_ips:parseInt(splitRecord[3]),downloads:parseInt([splitRecord[4]])
                  }
                }
                else{
                  return null;
                }
              }
              else{
                return null;
              }
            })
            records = _.filter(records,function(record){
              return (record != null)
            })
            var groups = _.chunk(records, 500);

            Promise.map(groups, function(group) {
              return BiocDownloadStatistics.bulkCreate(group, {
                updateOnDuplicate:true
              });
            }, {concurrency: 1}).then(function(){
              resolve();
            })
          })
        }).on('error', err => {
            reject(err)
        })
      })
    })
  },
  scrapeBiocTaskViews:function(){
    url = "http://www.bioconductor.org/packages/json/3.3/tree.js"
    return Package.getAllNamesOfType(2).then(function(packages){
      return new Promise((resolve, reject) => {
        http.get(url, response => {
          var body = ""
          response.on('data', function (chunk) {
            body = body + chunk;
          });
          response.on('end',function(){
            body = body.substring(14,body.length-1);
            json = JSON.parse(body)
            softwarePackages = _.filter(json.data,function(child){
              return child.attr.id == "Software"
            })
            softwarePackages[0].attr.id = "BioConductor"
            records = _processRecursive(softwarePackages,null,packages);
            console.log(records[0]);
            return TaskView.findOrCreate({
              where: {name:"BioConductor"},
              defaults:{url:"https://www.bioconductor.org/packages/release/BiocViews.html",in_view:null},
            }).then(function(){
              _writeData(records,1,resolve,reject)
            })
          }).on('error', err => {
            reject(err)
          })
        });
      })
    });
  }
};
          

_getIndexOfMonth= function(month){
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(month);
}

_processRecursive= function(json,inview,packages){
  var processData = new Array(0)
  for (var i=0;i<json.length;i++){
    child = json[i]
    if(child.attr){
      var viewName = child.attr.id;
      thisPackages= child.attr.packageList.split(",");
      childData = _processRecursive(child.children,viewName,packages);
      childPackages = _getAllPackages(childData)
      childPackages = _.filter(thisPackages,function(package){
        return (packages.indexOf(package)>-1 && !(childPackages.indexOf(package)>-1))
      })
      if(typeof processData[0] == "undefined"){
        processData[0] = [{viewName:viewName,inView:inview,packages:childPackages}]
      }
      else{
        processData[0] = processData[0].concat([{viewName:viewName,inView:inview,packages:childPackages}])
      }
      childData.forEach(function(child,j){
        if(typeof processData[j+1] == "undefined"){
          processData[j+1] = child
        }
        else{
          processData[j+1] = processData[j+1].concat(child)
        }
      })
    }
  }
  return processData;
}

_getAllPackages = function(arrayOfArrays){
  allPackages = []
  for(var i =0;i<arrayOfArrays.length;i++){
    for(var j =0;j<arrayOfArrays[i].length;j++){
      allPackages = allPackages.concat(arrayOfArrays[i][j].packages)
    }
  }
  return allPackages
}

_writeData = function(records,layer,resolve,reject){
  if(layer>=records.length){
    console.log("resolving")
    resolve();
  }
  else{
    Promise.map(records[layer],function(record){
      if(record.inView != null){
        return TaskView.findOne({
          where:{name:record.inView}
        }).then(function(inView){
          if(inView==null){
            console.log("in view")
            console.log(record.inView);
          }
          record.inView = inView.id
          return _writeRecord(record)
        })
      }
      else{
        _writeRecord(record)
      }
    }).then(function(){
      _writeData(records,layer+1,resolve,reject)
    })
  }
}
_writeRecord = function(record){
  return TaskView.findOrCreate({
    where: {name:record.viewName},
    defaults:{url:"https://www.bioconductor.org/packages/release/BiocViews.html#___"+record.viewName,in_view:record.inView},
  }).spread(function(instance, created) {
    var filtered = record.packages
    return Package.bulkCreate(filtered.map(function(packageName) {
      return {name: packageName};
    }), {
      fields: ['name'],
      ignoreDuplicates: true
    }).then(function(created) {
      return instance.setPackages(filtered).then(function(packagesInstance) {
        return instance;
      });
    });
  })
}



