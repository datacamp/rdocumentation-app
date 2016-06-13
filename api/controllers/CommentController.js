/**
 * CommentController
 *
 * @description :: Server-side logic for managing comments
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  /**
  * @api {post} /topics/:topicId/comments/ Post a comment to a topic
  * @apiName Post comment to topic
  * @apiGroup Comment

  * @apiDescription Create a new comment in the specified topic.
  * Note: require to be authenticated
  *
  *
  * @apiParam {Int} topicId Id of the topic to post to comment
  * @apiParam {String} comment Comment to push.
  */
  postCommentToTopic: function(req, res) {
    var topicId = req.param('topicId');
    var comment = req.param('comment');
    var user = req.user;

    var scope = sails.models.topic.associations.comments.scope;

    return Comment.create({
      description: comment,
      user_id: user.id,
      commentable: scope.commentable,
      commentable_id: topicId
    }).then(function(instance) {
      res.send(instance.toJSON());
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },


  /**
  * @api {post} /package/:name/versions/:version/comments/ Post a comment to a topic
  * @apiName Post comment to a package version
  * @apiGroup Comment

  * @apiDescription Create a new comment in the specified package version.
  * Note: require to be authenticated
  *
  *
  * @apiParam {Int} name Name of the package to comment
  * @apiParam {Int} name Version of the package to comment
  * @apiParam {String} comment Comment to push.
  */
  postCommentToVersion: function(req, res) {
    var packageName = req.param('name');
    var packageVersion = req.param('version');
    var comment = req.param('comment');
    var user = req.user;

    var scope = sails.models.packageversion.associations.comments.scope;

    return PackageVersion.findOne({
      where: {
        package_name: packageName,
        version: packageVersion
      },
      attributes: ['id']
    }).then(function(packageVersionInstance) {
      return Comment.create({
        description: comment,
        user_id: user.id,
        commentable: scope.commentable,
        commentable_id: packageVersionInstance.id
      });
    }).then(function(instance) {
      res.send(instance.toJSON());
    }).catch(function(err) {
      return res.negotiate(err);
    });
  }

};

