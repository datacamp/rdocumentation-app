var passport = require('passport'),
LocalStrategy = require('passport-local').Strategy;
module.exports = {
  express: {
    customMiddleware: function(app){
      console.log('Express midleware for passport');
      app.use(passport.initialize());
      app.use(passport.session());
    }
  }
};