var Promise = require('bluebird');
var _ = require('lodash');

module.exports = {

	mostDownloaded: function (req,res){
		ElasticSearchService.lastWeekPerDayTrending().then(function(data){
			var dict = {};
	      	var days = [];
	        data.forEach(function(day,i){
	        	var buckets = day.day.buckets;
	        	var time = day.key;
	        	days.push(time);
	        	buckets.forEach(function(bucket){
	        		var key = bucket.key;
	        		var array = dict[key.toString()]||[];
	        		array.push({
	        			count : bucket.doc_count,
	        			key   : bucket.key,
	        			timestamp : time
	        		});
	        		dict[key.toString()] = array;
	        	})
	        });
	        for(var key in dict){
	        	if(dict[key.toString()].length!=days.length){
	        		days.forEach(function(day){
	        			var found = false;
	        			var i = 0;
	        			while(!found&&i<dict[key.toString()].length){
	        				if(dict[key.toString()][i].timestamp==day){
	        					found = true;
	        				}
	        				i++;
	        			}
	        			if(!found){
	        				dict[key.toString()].splice(days.indexOf(day),0,{
	        					count : 0,
	        					key   : key.toString(),
	        					timestamp : day
	        				});
	        			}

	        		});
	        	}
	        }
	        var series =[];
	        for(var key in dict){
	        	series.push({
	        		key: key,
	        		values: dict[key.toString()]
	        	})
	        }
			return res.json(series);
		});
	},
	topKeywords: function (req,res){
		ElasticSearchService.topKeywords().then(function(result){
			return res.json(result);
		});
	},
	dependencyGraph: function(req,res){
		DownloadStatistic.getMostPopular().then(
			function(results){
				var nodes = [];
				var deps  = [];
				var promises = [];
				var nodelist =[];
				results[0].forEach(
					function(result,i){
						nodes.push(result["package_name"]);
						nodelist.push({
							name : result["package_name"],
							group : i
						});
						promises.push(Dependency.findByDependant(result["package_name"]).then(function(dep){
							dep.forEach(function(dependency){
							if(nodes.indexOf(dependency.dependency_name)==-1){
								nodes.push(dependency.dependency_name);
								nodelist.push({
									name : dependency.dependency_name,
									group : i
								});
							}
							deps.push({
								source : nodes.indexOf(dependency.dependency_name),
								target : nodes.indexOf(result.package_name),
								value  : 10
							});
						}); 
						}));
					});
				Promise.all(promises).then(function(){
					return res.json({
						nodes: nodelist,
						links: deps
					});
				});
				
			}
			);
	}
	}