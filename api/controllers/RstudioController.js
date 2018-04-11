/**
 * RStudioController
 *
 * @description :: Server-side logic for the RStudio help package with Rdocs
 * @help        :: See readme of the Rdocumentation package
 */
var Promise = require('bluebird');
var _ = require('lodash');

var splitByCommaOrNull = function(param){
  return (typeof param != "undefined" && param.length>0)? param.split(",") : null;
}

module.exports = {

  /**
  * @api {post} /rstudio/help
  * @api {post} /rstudio/helpSearch
  * @apiName serves the first ajax request in Rstudio with the information specified in data-tags
  * @apiGroup Rstudio
  *
  * @apiParam {String} the number of matches found by the help functions (online or offline)
  * @apiParam {String} topic the name of the topic, only used if there were no matches
  * @apiParam {json} data an array with the information for the matches to display in json format

  **/
  viewResults : function(req,res){
    var matches = req.param("matches")
    if(matches === 0){
      return ElasticSearchService.helpSearchQuery(req.param("topic"),['aliases'],true,2).then(function(json){
        return res.ok(json,'rStudio/topic_not_found.ejs');
      }).catch(function(err) {
        return res.negotiate(err);
      });
    }
    else{
      var data =req.param("data")
      if (data.length === 1){
        res.locals.path = data[0].uri;
        return res.ok(data[0],"topic/show.ejs")
      } else {
        return res.ok(data,"rStudio/list_options");
      }
    }
  },
    /**
  * @api {post} /rstudio/view
  * @apiName view the layout for rstudio with data attributes for the ajax request
  * @apiGroup Rstudio
  *
  * @apiParam {String} called_function the function called in Rstudio, other parameters are dependent of the function type
  */

  view : function(req,res){
    var called_function = req.param("called_function")
    switch(called_function) {
      /*
      retrieve data for help function
      */
      case "help":
        //parse parameters
        var packageNames = splitByCommaOrNull(req.param("packages"));
        var topicNames = splitByCommaOrNull(req.param("topic_names"));
        var topic = req.param("topic");
        var help_data = RStudioService.help(packageNames,topicNames,topic);
        break;

      /*
      retrieve data for help.search function
      */
      case "help_search":
        //parse parameters
        var packageNames = splitByCommaOrNull(req.param('matching_packages'));
        var topicNames = splitByCommaOrNull(req.param('matching_titles'));
        var pattern = req.param("query");
        var fields = req.param("fields").split(",");
        var fuzzy = (req.param("type") === "fuzzy")? fuzzy = true : fuzzy = false;
        var max_dist = 2;
        var ignore_case = (req.param("ignore_case") === "TRUE")? ignore_case = true : ignore_case = false;
        var help_data = RStudioService.helpSearch(packageNames, topicNames, pattern, fields, fuzzy, max_dist, ignore_case);
        break;

      /*
      retrieve data for package
      */
      case 'find_package':
        var help_data = RStudioService.findLatestVersion(req.param("package_name"));
        break;

      /*
      other pages do not need data
      */
      default:
        var help_data = null;
    }
    /*
    if there is data -> wait for it and put it in data tags of output, if there was no data, but the local help function did find data
    then return a 404 so the help function will fallback to the local help function
    */
    if(help_data != null){
      help_data.then(function(result){
        if(result.matches === 0 && result.found){
          return res.notFound();
        }
        else{
          result["called_function"] = called_function
          return res.ok(result,'rStudio/view.ejs')
        }
      })
      .catch(function(err) {
        return res.negotiate(err);
      })
    }
    else{
      res.ok(req.body,'rStudio/view.ejs');
    }
  },

  /**
  * @api {post} /rstudio/find_package
  * @apiName Redirects to a package given the package uri
  * @apiGroup Rstudio
  *
  * @apiParam {String} uri the uri of the package to redirect to
  **/

  findPackage : function(req,res){
    return res.rstudio_redirect(301, req.param("uri"));
  },

  /**
  * @api {post} /rstudio/make_default
  * @apiName makeDefault page for Rstudio
  * @apiGroup Rstudio
  **/
  makeDefault : function(req,res){
    res.ok([],'rStudio/make_default.ejs');
  },


  update : function(req,res){
    res.ok([],'rStudio/update.ejs');
  },

  /**
  * @api {get} /help
  * @apiName redirects all /help request to following part of the url
  * @apiGroup Rstudio
  **/
  redirect : function(req,res){
    res.rstudio_redirect(302, req._parsedOriginalUrl.path.substring(5,req._parsedOriginalUrl.path.length))
  }
};

