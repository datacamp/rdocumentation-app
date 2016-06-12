/**
 * Users
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */
var bcrypt = require('bcrypt');

module.exports = {

  attributes: {
    username: {
      type: Sequelize.STRING,
      required: true,
      unique: true
    },
    password: {
      type: Sequelize.STRING,
      required: true
    }
  },

  options: {

    hooks: {

      beforeCreate: function(user, cb) {
        bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) {
              console.log(err);
              cb(err);
            }else{
              user.password = hash;
              cb(null, user);
            }
          });
        });
      }

    },

    classMethods: {
      findById: function(id) {
        User.findOne(id);
      },

      findByUsername: function(u, fn) {
        User.findOne({
          username: u
        });
      }
    }

  }

};
