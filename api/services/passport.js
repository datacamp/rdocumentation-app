var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  BearerStrategy = require('passport-http-bearer').Strategy,
  bcrypt = require('bcrypt'),
  _ = require('lodash');


// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id).then(function (user) {
    var jsonUser = _.omit(user.toJSON(), 'password');
    done(null, jsonUser);
  }).catch(function(err){
    done(err);
  });
});

// Use the LocalStrategy within Passport.
// Strategies in passport require a `verify` function, which accept
// credentials (in this case, a username and password), and invoke a callback
// with a user object.
passport.use(new LocalStrategy(
  function (username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      // Find the user by username. If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message. Otherwise, return the
      // authenticated `user`.

      return User.findByUsername(username)
      .then(function(user) {
        if (!user) return done(null, false, { message: 'Unknown user ' + username } );
        bcrypt.compare(password, user.password, function(err, res) {
          if(err) return done(err);
          if(!res) return done(null, false, { message: 'Invalid Password' });
          else {
            var jsonUser = _.omit(user.toJSON(), 'password');
            return done(err, jsonUser, { message: 'Logged In Successfully' });
          }
        });

      })
      .catch(function(err) {
        done(err);
      });
    });
  }
));


//API-Token strategy
passport.use(new BearerStrategy(
  function(token, cb) {
    ApiToken.find({
      where: { token: token },
    }).then(function(tokenInstance) {
      if(!tokenInstance)
        cb(null, false, { message: 'Token not found' });
      else {
        var authorizations = _.pick(tokenInstance, ['can_read', 'can_create', 'can_update', 'can_delete']);
        cb(null, authorizations);
      }
    }).catch(function(err) {
      cb(err);
    });
  }));

module.exports = passport;
