module.exports = {

  me: function(req, res) {
    return res.json(req.user);
  }

};
