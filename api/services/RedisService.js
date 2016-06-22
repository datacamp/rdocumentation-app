var redis = require('redis'),
bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

client = redis.createClient();

client.on('error', function (err) {
    console.log('Error ' + err);
});
module.exports = client;