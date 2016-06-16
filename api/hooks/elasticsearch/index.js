module.exports = function es_init(sails) {
  global['Elasticsearch'] = require('elasticsearch');

  return {

    initialize: function(next) {
      var config = sails.config[this.configKey];
      var host = config.host;
      if (host === null) {
        throw new Error('Host not found in config/elasticsearch');
      }

      var es = new Elasticsearch.Client(config);
      global['es'] = es;

      next();
    }

  };
};
