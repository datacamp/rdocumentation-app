var _ = require('lodash');

// flash.js policy
module.exports = function(req, res, next) {
  res.locals.messages = { success: [], error: [], warning: [] };

  if(!req.session.messages) {
    req.session.messages = { success: [], error: [], warning: [] };
    return next();
  }

  res.locals.messages = _.clone(_.merge(req.session.messages, req.session.flash));

  // Clear flash
  req.session.messages = { success: [], error: [], warning: [] };
  return next();
};