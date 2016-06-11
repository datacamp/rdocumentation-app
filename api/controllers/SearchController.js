/**
 * SearchController
 *
 * @description :: Server-side logic for searching
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
 var Promise = require('bluebird');

module.exports = {

  quickSearch: function(req, res) {
    var token = req.body.token;

    Promise.join(
      Package.findAll({
        where: {
          name: {
            $like: '%' + token + '%'
          }
        },
        limit: 5
      }),
      // Topic.findAll({
      //   where: {
      //     name: {
      //       $like: '%' + token + '%'
      //     }
      //   },
      //   limit: 5
      // }),
      function(packages, topics) {
        return res.json({packages: packages, topics: topics});
      }
    ).catch(function(err) {
      return res.negotiate(err);
    });

  }

};
