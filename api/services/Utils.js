var _ = require('lodash');

module.exports = {


    /**
   * Parse `criteria` for a Waterline `find` or `update` from all
   * request parameters.
   *
   * @param  {Request} req
   * @return {Object}            the WHERE criteria object
   */
  parseCriteria: function ( req ) {
    var JSONP_CALLBACK_PARAM = 'callback';

    // Allow customizable blacklist for params NOT to include as criteria.
    req.options.criteria = req.options.criteria || {};
    req.options.criteria.blacklist = req.options.criteria.blacklist || ['limit', 'skip', 'page', 'perPage', 'sort', 'populate'];

    // Validate blacklist to provide a more helpful error msg.
    var blacklist = req.options.criteria && req.options.criteria.blacklist;
    if (blacklist && !_.isArray(blacklist)) {
      throw new Error('Invalid `req.options.criteria.blacklist`. Should be an array of strings (parameter names.)');
    }

    // Look for explicitly specified `where` parameter.
    var where = req.params.all().where;

    var tryToParseJSON = function(json) {
      if (!_.isString(json)) return null;
      try {
        return JSON.parse(json);
      }
      catch (e) { return e; }
    };
    // If `where` parameter is a string, try to interpret it as JSON
    if (_.isString(where)) {
      where = tryToParseJSON(where);
    }

    // If `where` has not been specified, but other unbound parameter variables
    // **ARE** specified, build the `where` option using them.
    if (!where) {

      // Prune params which aren't fit to be used as `where` criteria
      // to build a proper where query
      where = req.params.all();

      // Omit built-in runtime config (like query modifiers)
      where = _.omit(where, blacklist || ['limit', 'skip', 'sort', 'page', 'perPage']);

      // Omit any params w/ undefined values
      where = _.omit(where, function (p){ if (_.isUndefined(p)) return true; });

      // Omit jsonp callback param (but only if jsonp is enabled)
      var jsonpOpts = req.options.jsonp && !req.isSocket;
      jsonpOpts = _.isObject(jsonpOpts) ? jsonpOpts : { callback: JSONP_CALLBACK_PARAM };
      if (jsonpOpts) {
        where = _.omit(where, [jsonpOpts.callback]);
      }
    }

    // Merge w/ req.options.where and return
    where = _.merge({}, req.options.where || {}, where) || undefined;

    return where;
  },


  /**
   * @param  {Request} req
   */
  parseSort: function (req) {
    var sort = req.param('sort') || req.options.sort;
    if (typeof sort == 'undefined') {return undefined;}
    if (typeof sort == 'string') {
      try {
        sort = JSON.parse(sort);
      } catch(e) {}
    }
    return sort;
  },

   /**
   * @param  {Request} req
   */
  parseLimit: function (req) {
    var DEFAULT_LIMIT = req._sails.config.blueprints.defaultLimit || 30;
    var limit = req.param('limit') || (typeof req.options.limit !== 'undefined' ? req.options.limit : DEFAULT_LIMIT);
    if (limit) { limit = +limit; }
    return limit;
  },

  /**
   * @param  {Request} req
   */
  parseSkip: function (req) {
    var DEFAULT_SKIP = 0;
    var skip = req.param('skip') || (typeof req.options.skip !== 'undefined' ? req.options.skip : DEFAULT_SKIP);
    if (skip) { skip = +skip; }
    return skip;
  }




};
