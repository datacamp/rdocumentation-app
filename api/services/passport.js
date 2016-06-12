var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  bcrypt = require('bcrypt');


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
    done(null, user);
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
        if (!user) return { user: false, body: { message: 'Unknown user ' + username } };
        else return Promise.promisify(bcrypt.compare)(password, user.password)
          .then(function(res) {
            if (!res) return { user: false, body: { message: 'Invalid Password' } };
            var returnUser = {
              username: user.username,
              createdAt: user.created_at,
              id: user.id
            };
            return { user: returnUser, body: { message: 'Logged In Successfully' } };
          });
      })
      .then(function(response){
        return done(null, response.user, response.body);
      })
      .catch(function(err) {
        return done(err);
      });
    });
  }
));

module.exports = passport;
