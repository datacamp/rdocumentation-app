/**
 * AuthController
 *
 */
var passport = require('passport');
module.exports = {

  login: function (req, res) {
    res.view();
  },
  process: function(req, res){
    passport.authenticate('local', { successRedirect: '/',
                                     failureRedirect: '/login',
                                     failureFlash: true })(req, res);
  },
  logout: function (req,res){
    req.logout();
    res.send('logout successful');
  }
};

/**
 * Sails controllers expose some logic automatically via blueprints.
 *
 * Blueprints are enabled for all controllers by default, and they can be turned on or off
 * app-wide in `config/controllers.js`. The settings below are overrides provided specifically
 * for AuthController.
 *
 * NOTE:
 * REST and CRUD shortcut blueprints are only enabled if a matching model file
 * (`models/Auth.js`) exists.
 *
 * NOTE:
 * You may also override the logic and leave the routes intact by creating your own
 * custom middleware for AuthController's `find`, `create`, `update`, and/or
 * `destroy` actions.
 */

module.exports.blueprints = {

  // Expose a route for every method,
  // e.g.
  // `/auth/foo` =&gt; `foo: function (req, res) {}`
  actions: false,

  // Expose a RESTful API, e.g.
  // `post /auth` =&gt; `create: function (req, res) {}`
  rest: false,

  // Expose simple CRUD shortcuts, e.g.
  // `/auth/create` =&gt; `create: function (req, res) {}`
  // (useful for prototyping)
  shortcuts: false

};
