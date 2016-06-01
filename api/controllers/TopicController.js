/**
 * TopicController
 *
 * @description :: Server-side logic for managing topics
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  postRdFile: function(req, res) {
    var result = Topic.createWithRdFile({input: req.body});
    result.then(function(value) {
      //console.log(value.dependencies);
      res.json(value);
    }).catch(function(err){
        return res.negotiate(err);
    });
  },

};

