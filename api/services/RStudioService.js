var Promise = require('bluebird');
var _ = require('lodash');
cheerio = require('cheerio');

module.exports = {
	helpFindByTopicsAndPackages :function(topicNames,packageNames){
		return Alias.orderedFindByTopicsAndPackages(topicNames,packageNames).then(_processResults);
	},
	helpFindByAliasAndPackage : function(alias,packageNames){
		return Alias.orderedFindByAliasAndPackages(alias,packageNames).then(_processResults);
	},
	helpFindByAlias:function(alias){
		return Alias.orderedFindByAlias(alias).then(_processResults);
	},
  	findLatestVersion:function(packageName){
  		return PackageVersion.getLatestVersion(packageName).then(function(data){
  			return (data != null) ? {matches : 1, uri : data.uri, found : true} : {matches : 0, found : true};
  		});
  	},
  	help : function(packageNames,topicNames,topic){
  		var found = false
  		//option 1: there where functions found with the local help function
		if(packageNames != null && topicNames != null){
			var res = RStudioService.helpFindByTopicsAndPackages(topicNames,packageNames);
			var found = true;
		}
		//if no results where found by the local help function, if there was no problem with a package not found in the local library:
		else if(packageNames == null){
			var res = RStudioService.helpFindByAlias(topic);
		}
		//if a packageName was specified, the user had specified a package that R didn't recognize
		else{
			var res = RStudioService.helpFindByAliasAndPackage(topic,packageNames)
		}
		return res.then(function(data){
			return (data.length === 0)? {data: JSON.stringify([]), topic : topic, found :found, matches : 0} : {data : JSON.stringify(data), found : found, matches : data.length};
		});
  	},
  	
  	helpSearch : function(packageNames, topicNames, pattern, fields, fuzzy, max_dist, ignore_case){
  		if(topicNames== null || packageNames == null){
	      //the local help found no search
	      return ElasticSearchService.helpSearchQuery(pattern,fields,fuzzy,max_dist,ignore_case).then(function(json){
	      	return {data : JSON.stringify(json), found : false, matches : json.length}
	      })
	    }
	    else{
	      return RStudioService.helpFindByTopicsAndPackages(topicNames,packageNames).then(function(json){
	        return {data: JSON.stringify(json), found : true, matches : json.length}
	      })

	  	}
	}
       
};

_processResults=function(results){
	if (results.length == 0) return []; //no match found anywhere
    if (results.length == 1) { //if there is only 1 match, redirect to this one (except if function is going to run on mutltiple aliases)
		return Topic.findOnePopulated({id: results[0].id}).then(function(topic) {
	        if(topic === null) return [];
	        else {
	          return TopicService.processHrefs(topic)
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