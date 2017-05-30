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
  * @apiGroup Example
  * @apiPermission require to be authenticated
  * @apiDescription Create a new review in the specified topic.
  *
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
      RedisService.invalidateTopicById(topicId);
      if(req.wantsJSON) {
        return res.created(instance.toJSON());
      } else {
        FlashService.success(req, 'Example successfully added.');
        return res.rstudio_redirect(301, sails.getUrlFor({ target: 'Topic.findById' })
          .replace(':id', topicId)
          .replace('/api/', '/')
        );
      }
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },
/**
  * @api {delete} /examples/:exampleId Delete example
  * @apiName Delete the example with the id.
  * @apiGroup Example
  * @apiPermission The user owning the example must be authenticated.
  * @apiDescription Delete the example with the id.
  *
  *
  * @apiParam {Integer}     exampleId     The id of the example.
  *
  * @apiSuccess {String}    status        done when the operation was successful, forbidden if the user isn't properly authenticated.
  */
  deleteExample: function(req, res) {
    var exampleId = req.param('exampleId');
    var user = req.user;
    return Example.findOne({where:{id: exampleId, user_id: user.id}}).then(function(instance) {
      if(instance){
        RedisService.invalidateTopicById(instance.topic_id);
        return instance.destroy().then(function(){return res.json({status: "done"})});
      }else{
        return res.json({status: "forbidden"});
      }
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },
/**
  * @api {post} /examples/:exampleId Update example
  * @apiName Update the example with the id.
  * @apiGroup Example
  * @apiPermission The user owning the example must be authenticated.
  * @apiDescription Edit the example with the id.
  *
  *
  * @apiParam {Integer}     exampleId     The id of the example.
  * @apiParam {String}      text          Contents of the updated example (styling via markdown).
  *
  * @apiSuccess {String}    status        done when the operation was successful, forbidden if the user isn't properly authenticated.
  */
  updateExample: function(req, res) {
    var exampleId = req.param('exampleId');
    var exampleText = req.param('text');
    var user = req.user;
    return Example.findOne({where:{id: exampleId, user_id: user.id}}).then(function(instance) {
      if(instance){
        RedisService.invalidateTopicById(instance.topic_id);
        return instance.update({example: exampleText}).then(function(){return res.json({status: "done"})});
      }else{
        return res.json({status: "forbidden"});
      }
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },

   /**
  * @api {get} /topics/:topicId/reviews/ Get list of topic's examples
  * @apiName Example by topic
  * @apiGroup Example
  *
  * @apiDescription Get list of topic's example
  *
  * @apiParam {Int} topicId Id the topic for which we get the examples
  */
  findByTopic: function(req, res) {
    var topicId = req.param('topicId');
    var limit = Utils.parseLimit(req),
      offset = Utils.parseSkip(req),
      sort = Utils.parseSort(req) || 'created_at DESC';

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

