var bluebird = require('bluebird');

module.exports = function redis_init(sails) {
  global['Redis'] = require('redis');

  return {

    initialize: function(next) {
      var config = sails.config[this.configKey];
      var url = config.url;
      var options = config.options;

      bluebird.promisifyAll(Redis.RedisClient.prototype);
      bluebird.promisifyAll(Redis.Multi.prototype);

      var redisClient;
      if (url) {
        redisClient = Redis.createClient(url, options);
      } else {
        redisClient = Redis.createClient(options);
      }

      global['RedisClient'] = redisClient;

      if(config.logging) {
        redisClient.on('error', function (err) {
          console.log('Error ' + err);
        });
      }

      redisClient.flushdb();
      redisClient.flushall();

      next();
    }

  };
};
