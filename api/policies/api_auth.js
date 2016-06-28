var passport = require('passport');
/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to check authorization through token
 *
 */
module.exports = function(req, res, next) {
  if(req.method === 'GET' || req.method === 'HEAD') return next();
  passport.authenticate('bearer', function(err, authorizations, info) {
    if (err) { return next(err); }
    if (!authorizations) { return res.send(401, info); }
    else {
      var authorized;
      switch (req.method) {
        case 'POST':
          authorized = authorizations.can_create === true;
          break;
        case 'PUT':
          authorized = authorizations.can_update === true;
          break;
        case 'DELETE':
          authorized = authorizations.can_delete === true;
          break;
      }
      if (authorized) {
        next();
      } else {
        res.send(403);
      }
    }
  })(req, res, next);
};
