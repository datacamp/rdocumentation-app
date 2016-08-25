var Promise = require('bluebird');
var _ = require('lodash');

module.exports = {

	mostDownloaded: function (req,res){
		return RedisService.getJSONFromCache("trends_mostdownloaded",res,RedisService.DAILY,function(){
			return ElasticSearchService.lastMonthPerDayTrending().then(function(data){
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
				return series;
			});
		}).then(function(result){
			return res.json(result);
		});
	},
	topKeywords: function (req,res){
		return RedisService.getJSONFromCache("trends_topkeywords",res,RedisService.DAILY,function(){
			return ElasticSearchService.topKeywords().then(function(result){
				return result;
			});
		}).then(function(result){
			return res.json(result);
		});
	},
	dependencyGraph: function(req,res){
		return RedisService.getJSONFromCache("trends_dependencygraph_top10",res,RedisService.DAILY,function(){
			return DownloadStatistic.getMostPopular().then(
				function(results){
					var nodes = [];
					var deps  = [];
					var promises = [];
					var nodelist =[];
					results.forEach(
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
					return Promise.all(promises).then(function(){
						return {
							nodes: nodelist,
							links: deps
						};
					});
					
				}
			);
		}).then(function(result){
			return res.json(result)
		});
	},
	newPackages: function(req,res){
		PackageVersion.getNewestPackages().then(function(results){
			return res.json({
				newArrivals: results
			});
		});
	},
	newVersions: function(req,res){
		PackageVersion.getLatestUpdates().then(function(results){
			return res.json({
				newVersions: results
			});
		});
	},
	lastMonthMostDownloaded: function(req,res){
		DownloadStatistic.getMostPopular().then(function(results){
			return res.json({
				results: results
			});
		});
	},
	topCollaborators: function(req,res){
		Collaborator.topCollaborators().then(function(result){
			return res.json({
				results: result
			});
		});
	},
	startPage: function(req,res){
		var promises = [];
		var json = {};
		promises.push(PackageVersion.getNewestPackages().then(function(data){json.newPackages = data}));
		promises.push(PackageVersion.getLatestUpdates().then(function(data){json.newVersions = data}));
		promises.push(Collaborator.topCollaborators().then(function(data){json.topCollaborators = data}));
		promises.push(DownloadStatistic.getMostPopular().then(function(data){json.mostPopular = data}));
		Promise.all(promises).then(function(){return res.ok(json,"trends/show.ejs")});
	}
}