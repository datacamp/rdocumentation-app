var Promise = require('bluebird');
var _ = require('lodash');

module.exports = {

	/**
  * @api {get} /trends/download Trends in download behaviour of last month
  * @apiName Top 10 downloads per day for last 30 days grouped per package.
  * @apiGroup Trends
  *
  *
  * @apiSuccess {String}   key  	                Package name
  * @apiSuccess {Object[]} values               	List representing the number of downloads per day for the last 30 days.
  * @apiSuccess {String}	 values.count 					Number of downloads for the given package on the given day.
  * @apiSuccess {String} 	 values.key 	 					The name of the package (redundant).
  * @apiSuccess {timestamp}values.timestamp 			Day at which the downloads occurred expressed as a timestamp.
  */
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
		}).catch(function(err) {
      return res.negotiate(err);
    });
	},
	/**
  * @api {get} /trends/keyword Most popular keywords used
  * @apiName Top keywords used sorted from high to low.
  * @apiGroup Trends
  *
  *
  * @apiSuccess {String}   key  	                Package name
  * @apiSuccess {String}   doc_count              Number of occurences for keyword.
  */
	topKeywords: function (req,res){
		return RedisService.getJSONFromCache("trends_topkeywords",res,RedisService.DAILY,function(){
			return ElasticSearchService.topKeywords().then(function(result){
				return result;
			});
		}).then(function(result){
			return res.json(result);
		}).catch(function(err) {
      return res.negotiate(err);
    });
	},
	/**
  * @api {get} /trends/perrange packages per range
  * @apiName The number of packages in each download range (per 10000).
  * @apiGroup Trends
  *
  *
  * @apiSuccess {String}   key  	                Description of range
  * @apiSuccess {String}   count 			            Number of packages within the range
  */
	downloadsPerRange: function (req,res){
		return RedisService.getJSONFromCache("trends_downloadsperrange",res,RedisService.DAILY,function(){
			return DownloadStatistic.downloadsPerRange();
	   }).then(function(result){
			return res.json(result);
		}).catch(function(err) {
      return res.negotiate(err);
    });
	},
	/**
  * @api {get} /trends/graph Dependencies between top 10 packages as graph
  * @apiName Dependencies between top 10 packages as graph
  * @apiGroup Trends
  *
  *
  * @apiSuccess {Object[]} nodes                	List representing the 10 most popular packages and their direct dependencies
  * @apiSuccess {String}	 nodes.name   					The name of the package.
  * @apiSuccess {String} 	 nodes.group 	 					The group in the graph to which it belongs (grouped per popular package, grouped with most popular when multiple are available).
  * @apiSuccess {Object[]} links						 			The dependency links within the graph.
  * @apiSuccess {String}	 links.source						The dependant package.
  * @apiSuccess {String}	 links.target						The package on which it depends.
  * @apiSuccess {String}	 links.value						The weight of the connection between the packages.
  */
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
		})
    .catch(function(err) {
      return res.negotiate(err);
    });
	},
	/**
  * @api {get} /trends/newpackages New packages grouped per page
  * @apiDescription Shows the last new packages added to rdocumentation conveniently grouped per 10 for pagination.
  * @apiName Last new packages
  * @apiGroup Trends
  *
  * @apiParam {String}		 page   										The page shown (10 records per page, easy for pagination)
  *
  *
  * @apiSuccess {Object[]} newArrivals           			List representing the last new packages in rdocumetation offset by 10 times the given page.
  * @apiSuccess {String}	 newArrivals.package_name  	The name of the package.
  * @apiSuccess {timestamp}newArrivals.rel 	 					The date of release for the package.
  */
	newPackages: function(req,res){
		var page = req.param("page")||1;
		PackageVersion.getNewestPackages(page).then(function(results){
			return res.json({
				newArrivals: results
			});
		})
    .catch(function(err) {
      return res.negotiate(err);
    });
	},
	/**
  * @api {get} /trends/newversion Latest updates
  * @apiDescription Shows the last updated packages on rdocumentation conveniently grouped per 10 for pagination.
  * @apiName Last updated packages
  * @apiGroup Trends
  *
  * @apiParam {String}		 page   										The page shown (10 records per page, easy for pagination)
  *
  *
  * @apiSuccess {Object[]} newVersions           			List representing the last updated packages in rdocumetation offset by 10 times the given page.
  * @apiSuccess {String}	 newVersions.package_name  	The name of the package.
  * @apiSuccess {timestamp}newVersions.rel 	 					The date of update for the package.
  */
	newVersions: function(req,res){
		var page = req.param("page")||1;
		PackageVersion.getLatestUpdates(page).then(function(results){
			return res.json({
				newVersions: results
			});
		}).catch(function(err) {
      return res.negotiate(err);
    });
	},
	/**
  * @api {get} /trends/mostpopular Most popular
  * @apiDescription Shows the most packages on rdocumentation by direct downloads conveniently grouped per 10 for pagination.
  * @apiName Most popular packages
  * @apiGroup Trends
  *
  * @apiParam {String}		 page   										The page shown (10 records per page, easy for pagination)
  * @apiParam {String} 		 sort 											The parameter showing on which parameter this list is sorted. Either direct, indirect or total for respectively direct downloads, indirect downloads and total downloads.
  *
  *
  * @apiSuccess {Object[]} results		           			List representing the most popular packages in rdocumetation offset by 10 times the given page.
  * @apiSuccess {String}	 results.package_name 		 	The name of the package.
  * @apiSuccess {String}	 results.total  	 					Number of direct downloads in the last month for the given package.
  */
	lastMonthMostDownloaded: function(req,res){
		var page = req.param("page")||1;
		var sort = req.param("sort")||"direct";
		DownloadStatistic.getMostPopularPerPage(page,sort).then(function(results){
			return res.json(results);
		}).catch(function(err) {
      return res.negotiate(err);
    });
	},
	/**
  * @api {get} /trends/topcollaborators Top Collaborators
  * @apiDescription The most influential collaborators determined by the combined total number of downloads of the packages they maintain paged per 10.
  * @apiName Top collaborators
  * @apiGroup Trends
  *
  * @apiParam {String}		 page   										The page shown (10 records per page, easy for pagination)
  * @apiParam {String} 		 sort 											The parameter showing on which parameter this list is sorted. Either direct, indirect or total for respectively direct downloads, indirect downloads and total downloads.
  *
  *
  * @apiSuccess {Object[]} results 		          			List representing the most influential collaborators in rdocumetation offset by 10 times the given page.
  * @apiSuccess {String}	 results.name 					  	The name of the maintainer.
  * @apiSuccess {timestamp}results.total 	 	 					The combined total number of downloads of the packages maintained by the given person.
  */
	topCollaborators: function(req,res){
		var page = req.param("page")||1;
		var sort = req.param("sort")||"total";
		Collaborator.topCollaborators(page,sort).then(function(results){
			return res.json(results);
		})
    .catch(function(err) {
      return res.negotiate(err);
    });
	},

	startPage: function(req,res){
		var page1 = req.param('page1') || 1;
		var sort1 = req.param('sort1') || "direct";
		var page2 = req.param('page2') || 1;
		var sort2 = req.param('sort2') || "total";
		var page3 = req.param('page3') || 1;
		var page4 = req.param('page4') || 1;
		var promises = [];
		var json = {page1 : page1, page2 : page2, page3 : page3, page4 : page4};
		promises.push(PackageVersion.getNewestPackages(page3).then(function(data){json.newPackages = data;}));
		promises.push(PackageVersion.getLatestUpdates(page4).then(function(data){json.newVersions = data;}));
		promises.push(Collaborator.topCollaborators(page2,sort2).then(function(data){json.topCollaborators = data.results; json.topCollaboratorsSort = data.sort;}));
		promises.push(DownloadStatistic.getMostPopularPerPage(page1,sort1).then(function(data){json.mostPopular = data.results; json.mostPopularSort = data.sort;}));
    promises.push(sequelize.query("SELECT (SELECT COUNT(*) FROM Packages) as package_count, (SELECT COUNT(*) FROM Topics) as topic_count, (SELECT COUNT(*) FROM (SELECT DISTINCT name from Collaborators) c) as collaborator_count;")
      .then(function(counts) {
        var row = counts[0][0];
        json.package_count = row.package_count;
        json.topic_count = row.topic_count;
        json.collaborator_count = row.collaborator_count;
      })
    );
		Promise.all(promises).then(function(){return res.ok(json,"trends/show.ejs");})
    .catch(function(err) {
      return res.negotiate(err);
    });
  }

};
