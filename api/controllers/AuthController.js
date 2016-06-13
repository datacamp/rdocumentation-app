/**
 * AuthController
 *
 */
var passport = require('passport');
module.exports = {

  login: function (req, res) {
    res.view();
  },
  register: function (req, res) {
    res.view();
  },
  process: function(req, res){
    passport.authenticate('local', { successRedirect: '/users/me',
                                     failureRedirect: '/login',
                                     failureFlash: true })(req, res);
  },
  logout: function (req,res){
    req.logout();
    res.send('logout successful');
  }
};
