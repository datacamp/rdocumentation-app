// CronService.js - in api/services

/**
* All async tasks
*/

 _ = require('lodash');


module.exports = {

  //We need aggregated download stats in elasticsearch to be able to rescore the search result based on popularity
  indexAggregatedDownloadStats: function() {
    console.log('Started index aggregate stats job');
    //Get aggregated data
    ElasticSearchService.lastMonthDownloadCount().then(function (buckets) {
      console.log('got data');
      var body = _.flatMap(buckets, function(bucket) {
        return [
          { update: {_index: 'rdoc', _type: 'package', _id: bucket.key }},
          { doc : { last_month_downloads : bucket.download_count.value }, doc_as_upsert : true }
        ];
      });

      //bulk upsert document to elasticsearch
      return es.bulk({
        body: body
      });

    });

  }

};
