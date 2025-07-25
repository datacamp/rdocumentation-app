/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * Only applies to HTTP requests (not WebSockets)
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.http.html
 */
var dateFormat = require('dateformat');
var autoLink = require('autolink-js');
var marked = require('marked');
var cheerio = require('cheerio');
var forceHttpsSchema = require('express-force-https-schema').forceHttpsSchema;

module.exports.http = {

  /****************************************************************************
  *                                                                           *
  * Express middleware to use for every Sails request. To add custom          *
  * middleware to the mix, add a function to the middleware config object and *
  * add its key to the "order" array. The $custom key is reserved for         *
  * backwards-compatibility with Sails v0.9.x apps that use the               *
  * `customMiddleware` config option.                                         *
  *                                                                           *
  ****************************************************************************/

  middleware: {

  /***************************************************************************
  *                                                                          *
  * The order in which middleware should be run for HTTP request. (the Sails *
  * router is invoked by the "router" middleware below.)                     *
  *                                                                          *
  ***************************************************************************/

    order: [
      'startRequestTimer',
      'cookieParser',
      process.env.NODE_ENV === 'production' ? 'httpsRedirect' : false,
      'readRstudioSession',
      'session',
      'passportInit',
      'passportSession',
      'userInjector',
      'paramsInjector',
      'writeRstudioSession',
      'bodyParser',
      'handleBodyParserError',
      'compress',
      'methodOverride',
      '$custom',
      'router',
      'flash', // Connect-flash for passport.js
      'www',
      'favicon',
      '404',
      '500'
    ],

  readRstudioSession: function(req, res, next) {
    if(req.headers['x-rstudio-ajax'] === 'true') {
      if (req.headers['x-rstudio-session']);
        req.signedCookies['sails.sid'] = req.headers['x-rstudio-session'];

    }
    return next();
  },

  writeRstudioSession: function(req, res, next) {
    if(req.headers['x-rstudio-ajax'] === 'true') {
      res.set('X-Rstudio-Session', req.sessionID);
    }
    next();
  },

  userInjector: function (req, res, next) {
    res.locals.user = req.user;
    return next();
  },


  paramsInjector: function (req, res, next) {
    res.locals.inViewerPane = (req.param('viewer_pane') === '1') ? true : false;
    res.locals.inCampus = (req.param('campus_app') === '1') ? true : false;
    res.locals.fromRStudio = req.headers['x-rstudio-ajax'] === 'true' || (req.headers['user-agent'] && req.headers['user-agent'].indexOf('rstudio')>=0);
    res.locals.layout = (req.headers['x-rstudio-ajax'] === 'true' && req.path.indexOf('/taskviews/')<0 && req.path.indexOf('modalLogin')<0) ? 'rstudio_layout.ejs' : res.locals.layout;
    res.locals.path = req.path;
    res.locals.dateformat = dateFormat;
    res.locals.autoLink = autoLink;
    res.locals.lodash = require('lodash');
    res.locals.striptags = require('striptags');
    res.locals.dcBanner = req.cookies['banner-closed'] !== 'true';

    res.locals.md = function (md,baseLink) {
      //when multiple bases, pick the one from github
      var bases= baseLink.split(",");
      var base;
      if(bases.length>1){
        var i=0;
        while(i<bases.length && !bases[i].indexOf("github.com")>-1){
          i++;
        }
        if(bases[i-1].indexOf("github.com")>-1){
          baseLink = bases[i-1];
        }
        else{
          baseLink = "";
        }
      }
      //remove the link from the html tag
      if(baseLink !== ""){
        base = cheerio.load(baseLink);
        base = base('a').attr('href');
      }
      else{
        base = "";
      }
      var html = marked (md);
      $ = cheerio.load(html);
      //replace non external links with the base
      var links = $('a');
      links.attr('href',function(i,link){
        if(link && link.startsWith("/..")){
          if(base.indexOf("github.com")>-1){
            return link.replace("/..",base);
          }
          else{
            return null;
          }
        }
        else if(link && link.startsWith("/")){
          if(base.indexOf("github.com")>-1){
            return link.replace("/",base);
          }
          else{
            return null;
          }
        } else if(link && (!link.startsWith('http:/')) && (!link.startsWith('https:/'))) {
          if(base.indexOf("github.com")>-1){
            var substr = "";
            if(base.indexOf("github.com")>-1){
              if(!link.startsWith("/")){
                 substr = "/";
              }
              if(!link.startsWith("/master")){
                 substr = "/master".concat(substr);
              }
              return base+"/blob"+substr+link;
            }
          }
          else{
            return null;
          }
        }
        else{
          return link;
        }
      });
      //non external links for images need to be adjusted, here links from github are also in the repositories

      //github images are actually on /blob/master, sometimes one of these folders is specified, somtimes none
      links = $('img');

      links.attr('src',function(i,link){

        if(link && (!link.startsWith('http:/')) && (!link.startsWith('https:/'))){
          var substr = "";
          if(base.indexOf("github.com")>-1){
            if(!link.startsWith("/")){
               substr = "/";
            }
            if(!link.startsWith("/master")){
               substr = "/master".concat(substr);
            }
            return base+"/blob"+substr+link+"?raw=true";
          }
        }
        else{
          return link;
        }
      });
      return $.html();
    };

    return next();
  },

  poweredBy: false,

  /***************************************************************************
  *                                                                          *
  * The body parser that will handle incoming multipart HTTP requests. By    *
  * default as of v0.10, Sails uses                                          *
  * [skipper](http://github.com/balderdashy/skipper). See                    *
  * http://www.senchalabs.org/connect/multipart.html for other options.      *
  *                                                                          *
  * Note that Sails uses an internal instance of Skipper by default; to      *
  * override it and specify more options, make sure to "npm install skipper" *
  * in your project first.  You can also specify a different body parser or  *
  * a custom function with req, res and next parameters (just like any other *
  * middleware function).                                                    *
  *                                                                          *
  ***************************************************************************/

    // bodyParser: require('skipper')({strict: true})

    passportInit: require('passport').initialize(),
    passportSession: require('passport').session(),
    httpsRedirect: forceHttpsSchema({
      enable: true
    })
  },

  locals: {
    filters: {
      formatDate: function(date) {
        return dateFormat(date, 'mediumDate');
      }
    }
  }

  /***************************************************************************
  *                                                                          *
  * The number of seconds to cache flat files on disk being served by        *
  * Express static middleware (by default, these files are in `.tmp/public`) *
  *                                                                          *
  * The HTTP static cache is only active in a 'production' environment,      *
  * since that's the only time Express will cache flat-files.                *
  *                                                                          *
  ***************************************************************************/

  // cache: 31557600000
};
