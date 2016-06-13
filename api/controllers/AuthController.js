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
    passport.authenticate('local', { successRedirect: '/',
                                     failureRedirect: '/login',
                                     failureFlash: true })(req, res);
  },
  logout: function (req,res){
    req.logout();
    res.redirect('/')
  }
};
