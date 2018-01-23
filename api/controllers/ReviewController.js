/**
 * ReviewController
 *
 * @description :: Server-side logic for managing reviews
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  /**
  * @api {get} /reviews/:id Get a review by it's id
  * @apiName Get a review
  * @apiGroup Review
  *
  * @apiDescription Get a review by it's id.
  * Note: require to be authenticated
  *
  *
  * @apiParam {Int} id Id of the review to get
  */
  // findById (blueprint)

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
  postReviewToTopic: function(req, res) {
    var topicId = req.param('topicId');
    var rating = req.param('rating');
    var reviewTitle = req.param('title');
    var reviewText = req.param('text');
    var user = req.user;

    var scope = sails.models.topic.associations.reviews.scope;

    return Review.create({
      rating: rating,
      title: reviewTitle,
      text: reviewText,
      user_id: user.id,
      reviewable: scope.reviewable,
      reviewable_id: topicId
    }).then(function(instance) {
      RedisService.del('view_topic_' + topicId);
      if (req.wantsJSON) {
        return res.created(instance.toJSON());
      }
      FlashService.success(req, 'Review successfully added.');
      return res.status(301).redirect(sails.getUrlFor({ target: 'Topic.findById' })
        .replace(':id', topicId)
        .replace('/api/', '/')
      );
    }).catch(Sequelize.UniqueConstraintError, function(err) {
      FlashService.error(req, 'You already reviewed this topic');
      return res.status(301).redirect(sails.getUrlFor({ target: 'Topic.findById' })
          .replace(':id', topicId)
          .replace('/api/', '/')
        );
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
    var limit = Utils.parseLimit(req);
    var offset = Utils.parseSkip(req);
    var sort = Utils.parseSort(req) || 'created_at DESC';

    var scope = sails.models.topic.associations.reviews.scope;

    return Review.findAll({
      where: {
        reviewable_id: topicId,
        reviewable: scope.reviewable
      },
      order: sort,
      limit: limit,
      offset: offset
    }).then(function(instances) {
      if (instances === null) res.send([]);
      res.ok(instances.map(function(instance) { return instance.toJSON(); }));
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },


  /**
  * @api {get} /package/:name/versions/:version/reviews/ Get list of version's review
  * @apiName Review by version
  * @apiGroup Review
  *
  * @apiDescription Get list of version's review
  *
  * @apiParam {String} name Name of the package to review
  * @apiParam {String} version Version of the package to review
  */
  findByVersion: function(req, res) {
    var packageName = req.param('name');
    var packageVersion = req.param('version');
    var limit = Utils.parseLimit(req);
    var offset = Utils.parseSkip(req);
    var sort = Utils.parseSort(req) || 'created_at DESC';

    var scope = sails.models.packageversion.associations.reviews.scope;

    return Review.findAll({
      where: {
        reviewable: scope.reviewable
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
      if (instances === null) res.send([]);
      res.ok(instances.map(function(instance) {return instance.toJSON();}));
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },


  /**
  * @api {post} /package/:name/versions/:version/reviews/ Post a review to a topic
  * @apiName Post review to a package version
  * @apiGroup Review

  * @apiDescription Create a new review in the specified package version.
  * Note: require to be authenticated
  *
  *
  * @apiParam {String} name Name of the package to review
  * @apiParam {String} version Version of the package to review
  * @apiParam {String} review Review to push.
  */
  postReviewToVersion: function(req, res) {
    var packageName = req.param('name');
    var packageVersion = req.param('version');
    var rating = req.param('rating');
    var reviewTitle = req.param('title');
    var reviewText = req.param('text');
    var user = req.user;

    var scope = sails.models.packageversion.associations.reviews.scope;

    return PackageVersion.findOne({
      where: {
        package_name: packageName,
        version: packageVersion
      }
    }).then(function(packageVersionInstance) {
      return Review.create({
        rating: rating,
        title: reviewTitle,
        text: reviewText,
        user_id: user.id,
        reviewable: scope.reviewable,
        reviewable_id: packageVersionInstance.id
      }).then(function(instance) {
        RedisService.del('view_package_version_' + packageName + '_' + packageVersion);
        if (req.wantsJSON) {
          return res.created(instance.toJSON());
        }
        FlashService.success(req, 'Review successfully added.');
        return res.status(301).redirect(packageVersionInstance.uri);
      }).catch(Sequelize.UniqueConstraintError, function() {
        FlashService.error(req, 'You already reviewed this package');
        return res.status(301).redirect(packageVersionInstance.uri);
      });
    }).catch(function(err) {
      return res.negotiate(err);
    });
  }

};

