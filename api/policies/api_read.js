var passport = require('passport');
/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to check authorization through token
 *
 */
module.exports = function(req, res, next) {

  passport.authenticate('bearer', function(err, authorizations, info) {
    if (err) { return next(err); }
    if (!authorizations) { return res.send(401, info); }
    else {
      if (authorizations.can_delete === true) {
        next();
      } else {
        res.send(403);
      }
    }
  })(req, res, next);
};
