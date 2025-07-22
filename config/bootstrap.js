/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */

var _ = require('lodash');
module.exports.bootstrap = function(cb) {

  // PRODUCTION DEBUG: Secure redirect detection (only when explicitly enabled)
  if (process.env.NODE_ENV === 'production' && process.env.DEBUG_REDIRECTS === 'true') {
    var http = require('http');
    var originalRedirect = http.ServerResponse.prototype.redirect;
    
    http.ServerResponse.prototype.redirect = function(status, url) {
      if (arguments.length === 1) {
        url = status;
        status = 302;
      }
      
      // Sanitize URL to prevent information disclosure
      var safeUrl = url;
      try {
        var urlObj = new (require('url').URL)(url);
        // Remove query parameters and only log the essential parts
        safeUrl = urlObj.protocol + '//' + urlObj.hostname + urlObj.pathname;
        if (urlObj.search) {
          safeUrl += '?[PARAMS_REDACTED]';
        }
      } catch (e) {
        // If URL parsing fails, just log the path without params
        safeUrl = url.split('?')[0] + (url.includes('?') ? '?[PARAMS_REDACTED]' : '');
      }
      
      // Log redirect without exposing sensitive info
      sails.log.warn('REDIRECT_DEBUG: Status ' + status + ' to ' + safeUrl);
      
      // Only log stack trace for internal domain redirects (the actual issue)
      if (url.includes('.internal.datacamp.com')) {
        sails.log.error('INTERNAL_REDIRECT_DETECTED: Redirecting to internal domain');
        // Log only the first few stack frames to avoid exposing too much
        var stack = new Error().stack.split('\n').slice(0, 5).join('\n');
        sails.log.error('INTERNAL_REDIRECT_STACK:', stack);
      }
      
      return originalRedirect.call(this, status, url);
    };
    
    sails.log.info('REDIRECT_DEBUG: Secure redirect detection enabled');
  }

  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
  _.extend(sails.hooks.http.app.locals, sails.config.http.locals);
  cb();
};
