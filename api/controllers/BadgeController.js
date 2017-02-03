/**
 * BadgeController
 *
 * @description :: Server-side logic for the rdocumentation badge api
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var formatNumber = function(number){
  if(number > 999999) return (number/1000000).toFixed(1) + 'M';
  else if (number >999) return (number/1000).toFixed(1) + 'K';
  else return number;
};

module.exports = {

	  /**
  * @api {post} /badges/:downloadsKind/:packageName get monthly downloads badge for package
  * @apiName get monthly downloads badge
  * @apiGroup Badges
  *
  * @apiDescription Returns a badge for the package with the monthly downloads of the specified kind
  * @see https://github.com/metacran/cranlogs.app for the similar api for cran
  *
  * @apiParam {String}   downloadsKind        Direct downloads, indirect downloads or total downloads
  * @apiParam {String}   packageName          Name of the package
  */
  getDownloadStatsBadge: function(req, res) {
  	res.redirect('/badges/'+encodeURIComponent(req.param("downloadsKind"))+'/last_month/'+encodeURIComponent(req.param("packageName")))
  },

  	  /**
  * @api {post} /badges/:downloadsKind/:period/:packageName get badge for package for downloads in specified period
  * @apiName get badge for specfied period
  * @apiGroup Badges
  *
  * @apiDescription Returns a badge for the package with the downloads of the specified kind and the specified period
  * @see https://github.com/metacran/cranlogs.app for the similar api for cran
  *
  * @apiParam {String}   downloadsKind        Direct downloads, indirect downloads or total downloads
  * @apiParam {String}   period               The period over which downloads are measured: either last_day,last_week,last_month or last_year
  * @apiParam {String}   packageName          Name of the package
  */
  getDownloadStatsPeriodBadge: function(req, res) {
  	var downloadsKind=req.param("downloadsKind");
  	var period = req.param("period");
  	var nb_days=0;
  	switch(period) {
	    case "last_year":
	        nb_days = 365
	        period = "year"
	        break;
	    case "last_week":
	        nb_days = 7
	        period = "week"
	        break;
	    case "last_day":
	    	nb_days = 1
	    	period = "day"
	    	break;
	    default:
	        nb_days = 31
	        period = "month"
	}
  	var packageName=req.param("packageName");
  	DownloadStatistic.findLastIndexedDay().then(function(last_day){
  		var downloads = 0;
  		var statsName="";
		DownloadStatistic.AllStatsNDaysAgo(last_day,nb_days,packageName).then(function(data){
			if(data==null){
				res.notFound();
			}
			else{
				switch(downloadsKind) {
				case "indirect_downloads":
					downloads = data["sum_indirect"]
					statsName = "indirect downloads"
					break;
				case "direct_downloads":
					downloads = data["sum_direct"]
					statsName = "direct downloads"
					break;
				default:
					downloads = data["sum_indirect"] + data["sum_direct"]
					statsName = "total downloads"
				}
				var length = 20+ (String(downloads).length + period.length+1)*6
				var statistics = {
					downloads:formatNumber(downloads),
					statsName:statsName,
					period:period,
					length:length
				};
        res.type('image/svg+xml');
        res.locals.layout = null;
				res.view('badges/downloads_badge.ejs',{data:statistics});
			}
		})
		.catch(function(err){
			console.log(err.message);
		});
	}).catch(function(err){
		console.log(err.message);
	});
  },
	  /**
  * @api {post} /badges/version/:packageName get version badge for rdocumentation
  * @apiName get version badge for rdocumentation
  * @apiGroup Badges
  *
  * @apiDescription Returns a badge for the version on rdocumentation of the specified package
  * @see https://github.com/metacran/cranlogs.app for the similar api for cran
  *
  * @apiParam {String}   packageName          Name of the package
  */
  getLatestVersion: function(req, res) {
  	var packageName = req.param("packageName");
  	Package.getLatestVersionNumber(packageName).then(function(_package){
  		if(_package===null){
  			var version="not published";
  			var color="#e05d44";
  		}
  		else{
  			var version=_package.latest_version.dataValues.version;
  			var color="#33aacc";
  		}
  		var length = 40+version.length*6;
      res.type('image/svg+xml');
      res.locals.layout = null;
  		res.view('badges/version_badge.ejs',{data:{version:version,color:color,length:length}});
  	});
  },
};
