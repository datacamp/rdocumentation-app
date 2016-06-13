module.exports = {

  me: function(req, res) {
    return res.json(req.user);
  },

  create: function(req, res) {
    var result = User.create(req.body);
    result.then(function(value) {
      passport.authenticate('local', { successRedirect: '/users/me',
                                       failureRedirect: '/login',
                                       failureFlash: true })(req, res);
      res.location('/users/me');
    }).catch(Sequelize.UniqueConstraintError, function (err) {
      return res.send(409, err);
    }).catch(Sequelize.ValidationError, function (err) {
      return res.send(400, err.errors);
    }).catch(function(err){
      return res.negotiate(err);
    });
  }

};
