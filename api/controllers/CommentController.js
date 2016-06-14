/**
 * CommentController
 *
 * @description :: Server-side logic for managing comments
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  /**
  * @api {get} /comments/:id Get a comment by it's id
  * @apiName Get a comment
  * @apiGroup Comment
  *
  * @apiDescription Get a comment by it's id.
  * Note: require to be authenticated
  *
  *
  * @apiParam {Int} id Id of the comment to get
  */
  //findById (blueprint)

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
      if(req.wantsJSON) {
        return res.created(instance.toJSON());
      } else {
        FlashService.success(req, 'Review successfully added.');
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
  * @api {get} /topics/:topicId/comments/ Get list of topic's comment
  * @apiName Comment by topic
  * @apiGroup Comment
  *
  * @apiDescription Get list of topic's comment
  *
  * @apiParam {Int} topicId Id the topic for which we get the comments
  */
  findByTopic: function(req, res) {
    var topicId = req.param('topicId');
    var limit = Utils.parseLimit(req),
      offset = Utils.parseSkip(req),
      sort = Utils.parseSort(req) || 'created_at DESC';
    var user = req.user;

    var scope = sails.models.topic.associations.comments.scope;

    return Comment.findAll({
      where: {
        commentable_id: topicId,
        commentable: scope.commentable
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


  /**
  * @api {get} /package/:name/versions/:version/comments/ Get list of version's comment
  * @apiName Comment by version
  * @apiGroup Comment
  *
  * @apiDescription Get list of version's comment
  *
  * @apiParam {String} name Name of the package to comment
  * @apiParam {String} version Version of the package to comment
  */
  findByVersion: function(req, res) {
    var packageName = req.param('name');
    var packageVersion = req.param('version');
    var limit = Utils.parseLimit(req),
      offset = Utils.parseSkip(req),
      sort = Utils.parseSort(req) || 'created_at DESC';
    var user = req.user;

    var scope = sails.models.packageversion.associations.comments.scope;

    return Comment.findAll({
      where: {
        commentable: scope.commentable
      },
      attributes: { exclude: ['package_version'] },
      include: [{ model: PackageVersion, as: 'package_version', where: {
        package_name: packageName,
        version: packageVersion
      }}],
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


  /**
  * @api {post} /package/:name/versions/:version/comments/ Post a comment to a topic
  * @apiName Post comment to a package version
  * @apiGroup Comment

  * @apiDescription Create a new comment in the specified package version.
  * Note: require to be authenticated
  *
  *
  * @apiParam {String} name Name of the package to comment
  * @apiParam {String} version Version of the package to comment
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
      }
    }).then(function(packageVersionInstance) {
      return Comment.create({
        description: comment,
        user_id: user.id,
        commentable: scope.commentable,
        commentable_id: packageVersionInstance.id
      }).then(function(instance) {
        if(req.wantsJSON) {
          return res.created(instance.toJSON());
        } else {
          FlashService.success(req, 'Review successfully added.');
          return res.redirect(packageVersionInstance.uri);
        }
      });
    }).catch(function(err) {
      return res.negotiate(err);
    });
  }

};

