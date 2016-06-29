// RedisService.js - in api/services

/**
* Abstract away boilerplate code to work with Redis
*/


module.exports = {

  DAILY: 86400,

  WEEKLY: 604800,

  // missFn must be a function that return either a json or a Promise resolving to a json
  // it will be executed if nothing is found in cache
  getJSONFromCache: function(key, res, expire, missFn) {

    return RedisClient.getAsync(key).then(function(response){
      res.set('Cache-Control', 'max-age=' + expire);
      if(response) {
        var json = JSON.parse(response);
        json.fromCache = true;
        res.set('X-Cache', 'hit');
        return json;
      } else {
        return Promise.resolve(missFn()).then(function(value) {
          if (value && process.env.NODE_ENV === 'production') RedisClient.set(key, JSON.stringify(value));
          res.set('X-Cache', 'miss');
          RedisClient.expire(key, expire);
          return value;
        });
      }
    });
  }


};
