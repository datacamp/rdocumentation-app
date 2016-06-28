exports.config = {
  app_name: [process.env.NEW_RELIC_APP],
  license_key: 'e6cd6d8afacfcc7191c34c933af26309dfa57cc6',
  logging: {
    level: 'warn', // can be error, warn, info, debug or trace
    rules: {
      ignore: ['^/socket.io/*/xhr-polling']
    }
  }
};
