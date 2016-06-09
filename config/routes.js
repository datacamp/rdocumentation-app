/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {
  '/': {
    view: 'homepage'
  },

  //***** Package *****
    // API
    'get /api/packages/:name': 'PackageController.findByName',
    // HTML
    'get /packages/:name': 'PackageController.findByName',
  //***** /Package *****

  //***** PackageVersion *****
    // API
    'get /api/packages/:name/versions/:version': 'PackageVersion.findByNameVersion',
    'post /api/versions': 'PackageVersion.postDescription',
    // HTML
    'get /packages/:name/versions/:version': 'PackageVersion.findByNameVersion',
  //***** /PackageVersion *****

  //***** Topic *****
    //API
    'get /api/topics/:id': 'Topic.findById',
    'get /api/packages/:name/versions/:version/topics/:topic': 'Topic.findByName',
    'post /api/packages/:name/versions/:version/topics': 'Topic.postRdFile',
    //HTML
    'get /packages/:name/versions/:version/topics/:topic': 'Topic.findByName',
  //***** /Topic *****

  // Link
  'get /link/:alias': 'Topic.findByAlias',

  // Quick Search
  'post /api/quick_search': 'SearchController.quickSearch'
};
