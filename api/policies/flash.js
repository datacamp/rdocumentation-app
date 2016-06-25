var _ = require('lodash');

// flash.js policy
module.exports = function(req, res, next) {
  res.locals.messages = { success: [], error: [], warning: [] };
  console.log(session);
  if(!req.session.messages) {
    req.session.messages = { success: [], error: [], warning: [] };
    return next();
  }

  if(req.session.flash) {
    res.locals.messages = _.clone(_.merge(req.session.messages, req.session.flash));
    req.session.flash = {};
  } else {
    res.locals.messages = _.clone(req.session.messages);
  }

  // Clear flash
  req.session.messages = { success: [], error: [], warning: [] };

  return next();
};
