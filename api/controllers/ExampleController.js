/**
 * Example
 *
 * @description :: Server-side logic for managing reviews
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {


  /**
  * @api {post} /topics/:topicId/reviews/ Post a review to a topic
  * @apiName Post review to topic
  * @apiGroup Review

  * @apiDescription Create a new review in the specified topic.
  * Note: require to be authenticated
  *
  *
  * @apiParam {Int} topicId Id of the topic to post to review
  * @apiParam {String} review Review to push.
  */
  postExampleToTopic: function(req, res) {
    var topicId = req.param('topicId');
    var exampleText = req.param('text');
    var user = req.user;

    return Example.create({
      example: exampleText,
      user_id: user.id,
      topic_id: topicId
    }).then(function(instance) {
      RedisClient.del('view_topic_' + topicId);
      if(req.wantsJSON) {
        return res.created(instance.toJSON());
      } else {
        FlashService.success(req, 'Example successfully added.');
        return res.redirect(sails.getUrlFor({ target: 'Topic.findById' })
          .replace(':id', topicId)
          .replace('/api/', '/')
        );
      }
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },





   /**
  * @api {get} /topics/:topicId/reviews/ Get list of topic's review
  * @apiName Review by topic
  * @apiGroup Review
  *
  * @apiDescription Get list of topic's review
  *
  * @apiParam {Int} topicId Id the topic for which we get the reviews
  */
  findByTopic: function(req, res) {
    var topicId = req.param('topicId');
    var limit = Utils.parseLimit(req),
      offset = Utils.parseSkip(req),
      sort = Utils.parseSort(req) || 'created_at DESC';
    var user = req.user;

    return Example.findAll({
      where: {
        topic_id: topicId,
      },
      order: sort,
      limit: limit,
      offset: offset
    }).then(function(instances) {
      if(instances === null) res.send([]);
      res.ok(instances.map(function(instance) {return instance.toJSON();}));
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },


};

