var Promise = require('bluebird');
var _ = require('lodash');

module.exports = {

	mostDownloaded: function (req,res){
		ElasticSearchService.lastWeekPerDayTrending().then(function(result){
			return res.json(result);
		});
	}

	}