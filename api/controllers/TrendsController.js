var Promise = require('bluebird');
var _ = require('lodash');

module.exports = {

	mostDownloaded: function (req,res){
		ElasticSearchService.lastWeekPerDayTrending().then(function(result){
			return res.json(result);
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
				console.log(results[0]);
				var nodes = [];
				var deps  = [];
				var promises = [];
				results[0].forEach(
					function(result){
						nodes.push(result["package_name"]);
						console.log(nodes);
						promises.push(Dependency.findByDependant(result["package_name"]).then(function(dep){
							console.log(dep);
							dep.forEach(function(dependency){
							if(nodes.indexOf(dependency.dependency_name)==-1){
								nodes.push(dependency.dependency_name);
							}
							deps.push({
								source : nodes.indexOf(dependency.dependency_name),
								target : nodes.indexOf(result.package_name),
								value  : 25
							});
						}); 
						}));
					});
				Promise.all(promises).then(function(){
					nodelist =[];
					nodes.forEach(function(node){
						nodelist.push({
							name : node,
							group : 1
						});
					});
					return res.json({
						nodes: nodelist,
						links: deps
					});
				});
				
			}
			);
	}
	}