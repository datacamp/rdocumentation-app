/**
 * HomeController
 *
 * @description :: Server-side logic for the home page statistics
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');
var numeral = require('numeral');

module.exports = {

  index: function(req, res) {
    return res.redirect(302, "https://rdocumentation.org");
  },

  status: function(req, res) {
    return res.send(200, 'ok');
  }
};

