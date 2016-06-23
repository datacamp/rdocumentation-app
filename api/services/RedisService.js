// RedisService.js - in api/services

/**
* Abstract away boilerplate code to work with Redis
*/


module.exports = {

  // missFn must be a function that return either a json or a Promise resolving to a json
  // it will be executed if nothing is found in cache
  getJSONFromCache: function(key, missFn) {

    return RedisClient.getAsync(key).then(function(response){
      if(response) {
        var json = JSON.parse(response);
        json.fromCache = true;
        return json;
      } else {
        return Promise.resolve(missFn());
      }
    });
  }


};
