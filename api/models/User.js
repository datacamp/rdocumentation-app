/**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */
var bcrypt = require('bcrypt');
var Promise = require('bluebird');

module.exports = {

  attributes: {
    username: {
      type: Sequelize.STRING,
      required: true,
      unique: true,
      validate: {
        max: 40,
        min: 3
      }
    },
    password: {
      type: Sequelize.STRING,
      required: true
    }
  },

  options: {
    underscored: true,

    hooks: {

      beforeCreate: function(user) {
        return Promise.promisify(bcrypt.genSalt)(10)
        .then(function(salt) {
          return Promise.promisify(bcrypt.hash)(user.password, salt)
          .then(function(hash) {
            user.password = hash;
            return user;
          });
        });
      }

    },

    classMethods: {
      findById: function(id) {
        return User.findOne({
          where: {id: id}
        });
      },

      findByUsername: function(u) {
        return User.findOne({
          where: {username: u}
        });
      }
    }

  }

};
