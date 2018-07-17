var cron = require('node-cron');

module.exports = function worker(sails) {

  return {

    initialize: function (next) {

      if (process.env.NODE_ENV === 'worker') {
        cron.schedule('0 */12 * * *', function() {
          console.log('Indexing latest stats');
          CronService.indexDownloadCounts().then(function(resp) {
            console.log('Latest stats indexed.');
          }).catch({ message: 'empty' }, function() {
            console.log('No stats for this time range yet');
          });
        });

        cron.schedule('30 */12 * * *', function() {
          console.log('Updating percentiles');
          CronService.updatePercentile().then(function(resp) {
            console.log("Updated percentiles");
          });
        });
      }
      next();
    }

  };
};
