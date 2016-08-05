var Promise = require('bluebird');
var _ = require('lodash');
cheerio = require('cheerio');

module.exports = {
	helpFindByTopicsAndPackages :function(alias,topicNames,packageNames){
		return Alias.orderedFindByTopicsAndPackages(alias,topicNames,packageNames).then(_processResults);
	},
	helpFindByAlias:function(alias){
		return Alias.orderedFindByAlias(alias).then(_processResults);
	},
  	findLatestVersion:function(packageName){
  		return PackageVersion.getLatestVersion(packageName);
  	}
       
};

_processResults=function(results){
	if (results.length == 0) return []; //no match found anywhere
    if (results.length == 1) { //if there is only 1 match, redirect to this one (except if function is going to run on mutltiple aliases)
		return Topic.findOnePopulated({id: results[0].id}).then(function(topic) {
	        if(topic === null) return [];
	        else {
	          return TopicService.computeLinks('/link/', topic)
	            .then(function(topic) {
	              topic.pageTitle = topic.name;
	              return [topic];
	            });
	        }
	    })
	      .catch(function(err){
	      	console.log(err.message);
	      });
	}
    return results; //return all matches to list
};