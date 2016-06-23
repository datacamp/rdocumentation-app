

module.exports.cron = {
  myFirstJob: {
    schedule: '0 0 1/1 * * *',
    onTick: function () {
      CronService.indexAggregatedDownloadStats();
    }
  }
};
