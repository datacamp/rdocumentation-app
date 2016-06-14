module.exports = {

  me: function(req, res) {
    return res.json(req.user);
  },

  create: function(req, res) {
    // Check if password and confirm_password are the same
    if(req.body.password !== req.body.confirm_password){
      FlashService.error(req, 'Passwords must match.');
      return res.redirect('/register');
    }
    var result = User.create(req.body);
    result.then(function(value) {
      passport.authenticate('local', { successRedirect: '/',
                                       failureRedirect: '/register',
                                       failureFlash: true })(req, res);
    }).catch(Sequelize.UniqueConstraintError, function (err) {
      FlashService.error(req, 'Username "' + req.body.username + '" has been taken.');
      return res.redirect('/register');
    }).catch(Sequelize.ValidationError, function (err) {
      err.errors.forEach(function(error){
        FlashService.error(req, error.message);
      });
      return res.redirect('/register');
    });
  }

};
