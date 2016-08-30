var lifter = require('./sails-lifter');
var _ = require('lodash');
var Promise = require('bluebird');
var fs = require('fs');


//Load sails to benefit from services and models definition
// This will load a minimal version of sails without http, sessions, controllers, ...
task('sails-load', {async: true}, function(){
  lifter.lift(function(err, sails) {
    complete();
  });
});

task('recoverPackageVersions',['sails-load'], {async: true}, function(){
  RecoverService.recoverPackageVersionFromSourceJSON().then(function() {
    complete();
  });
});


task('test-extraction',['sails-load'], function(){
  var nlp = require('nlp_compromise');

  var sanitized = AuthorService.authorsSanitizer("Luciano Souza <lcnsza@gmail.com>, Lucas Gallindo <lgallindo@gmail.com>, Luciano Serafim de Souza <lucianoserafimdesouza@gmail.com>");

  console.log(sanitized);

});


desc('Call a fn in sails');
task('sitemap', ['sails-load'], {async: true}, function () {

  var host = 'http://www.rdocumentation.org';
  var directoryUrl = host + '/sitemap/';

  var sg = require('sitemap-stream')({
    sitemapDirectoryUrl: directoryUrl,
    outputFolder:'assets/sitemap/'
  });
  //set concurrency to maximum number of connection to database
  var concurrency = sails.config.connections.sequelize_mysql.options.pool.max;

  Package.findAll({
    include: [{
      model: PackageVersion,
      as: "latest_version",
      attributes: [ "id", "version", "package_name" ],
      required: true
    }],
    attributes:['name', 'latest_version_id']
  }).map(function(package){
    var p = package.latest_version;
    var package_json = p.toJSON();
    var url =  package_json.uri;

    sg.inject(host + url);

    return p.getTopics({
      attributes: ['id', 'package_version_id', 'name']
    }).map(function(t) {
      var topic_json = t.toJSON();
      var url = '/packages/'+
        encodeURIComponent(package_json.package_name)+
        '/versions/'+
        encodeURIComponent(package_json.version)+
        '/topics/' +
        encodeURIComponent(topic_json.name);
      var item = {
        url: host + url,
        changeFreq: "weekly"
      };
      sg.inject(item);
      return 1;
    });

  }, {concurrency: concurrency})
  .then(function() {
    return sg.done();
  });

  sg.on('drain', function() {
    console.info('drain');
  });

  sg.on('done', function() {
    console.info('The job is done !');
    complete();
  });

});


task('url-checker', ['sails-load'], {async: true}, function () {

  var host = process.env.BASE_URL;
  //set concurrency to maximum number of connection to database
  var concurrency = sails.config.connections.sequelize_mysql.options.pool.max;

  var blc = require('broken-link-checker');

  var brokens = [];

  var eventify = function(arr, callback) {
    arr.push = function(e) {
      Array.prototype.push.call(arr, e);
      callback(arr);
    };
  };

  eventify(brokens, function(updatedArr) {
    fs.writeFile("jake/brokens.json", JSON.stringify(updatedArr, null, 2), function(err) {
      if(err) {
        return console.log(err);
      }
      console.log("Wrote file !");
    });
  });

  var htmlUrlChecker = new blc.HtmlUrlChecker({
    excludeExternalLinks: true,
    filterLevel: 0,
    maxSockets: 400,
    maxSocketsPerHost: 400,
    excludedKeywords: ['/login', '/register']
  }, {
    link: function(result, customData){
      console.log(result.url.resolved);
      if (result.broken) {
        brokens.push(result);
        console.log(result.brokenReason);
        //=> HTTP_404
      } else if (result.excluded) {
        console.log(result.excludedReason);
        //=> BLC_ROBOTS
      }
    },
    page: function(error, pageUrl, customData){
      console.log("Retrieved: " + pageUrl);
      if(error) {
        console.log(error);
        brokens.push(pageUrl);
      }
    },
    end: function(){
      console.info('The job is done !');
      console.log(brokens);
      //complete();
    }
  });

  Package.findAll({
    include: [{
      model: PackageVersion,
      as: "latest_version",
      attributes: [ "id", "version", "package_name" ],
      required: true
    }],
    attributes:['name', 'latest_version_id']
  }).map(function(package){
    var p = package.latest_version;
    var package_json = p.toJSON();
    var url =  package_json.uri;

    htmlUrlChecker.enqueue(host + url);

    return p.getTopics({
      attributes: ['id', 'package_version_id', 'name']
    }).map(function(t) {
      var topic_json = t.toJSON();
      var url = '/packages/'+
        encodeURIComponent(package_json.package_name)+
        '/versions/'+
        encodeURIComponent(package_json.version)+
        '/topics/' +
        encodeURIComponent(topic_json.name);

      htmlUrlChecker.enqueue(host + url);
      return 1;
    });

  }, {concurrency: concurrency})
  .then(function() {
    htmlUrlChecker.resume();
  });

});

task('download-statistics', ['sails-load'], {async: true}, function () {
  CronService.splittedAggregatedDownloadstats(1).then(function(resp) {
    console.log("Done !");
    complete();
  }).catch({message: "empty"}, function() {
    console.log("No stats for this time range yet");
    complete();
  });
});

task('bioc-download-statistics', ['sails-load'], {async: true}, function () {
  CronService.biocSplittedAggregatedDownloadstats(36).then(function(resp) {
    console.log("Done !");
    complete();
  }).catch({message: "empty"}, function() {
    console.log("No stats for this time range yet");
    complete();
  });
});

task('bootstrap-splitted-download-statistics', ['sails-load'], {async: true}, function () {
  var lastMonth = _.range(3, 28);
  Promise.map(lastMonth, function(day) {
    return CronService.splittedAggregatedDownloadstats(day).then(function(resp) {
      console.log("Done " + day);
      return 1;
    }).catch({message: "empty"}, function() {
      console.log("No stats for this time range yet");
      return 0;
    });
  }, {concurrency: 1}).then(function () {
    complete();
  });

});

jake.addListener('complete', function () {
  process.exit();
});

task('parse-author', ['sails-load'], {async: true}, function () {
  AuthorService.parseAllAuthors().then(function(){
    complete();
  });
});

task('percentile', ['sails-load'], {async: true}, function () {
  ElasticSearchService.updateLastMonthPercentiles().then(function(){
    complete();
  });
});
