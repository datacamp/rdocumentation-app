

module.exports = {

  lift: function(done) {
    var sails = require('sails');
    require('dotenv').config({silent: true});
    var liftSails = function (config, cb) {
      if (sails.config) {
        return cb();
      }

      config.hooks =  {
        blueprints: false,
        controllers: false,
        cors: false,
        csrf: false,
        grunt: false,
        http: false,
        i18n: false,
        logger: false,
        orm:false,
        policies: false,
        pubsub: false,
        request: false,
        responses: false,
        //services: leave default hook,
        session: false,
        sockets: false,
        views: false
      };
      // Start server
      sails.load(config, cb);
    };

    liftSails({
      port: 1338,
      environment: process.env.NODE_ENV,
      tasks: true
    }, done);
  }

};
