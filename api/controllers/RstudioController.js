/**
 * RStudioController
 *
 * @description :: Server-side logic for the RStudio help package with Rdocs
 * @help        :: See readme of the Rdocumentation package
 */
var Promise = require('bluebird');
var _ = require('lodash');


module.exports = {

  /**
  * @api {post} /rstudio/normal/help
  * @apiName Get help for topic using the normal help function in rstudio
  * @apiGroup Rstudio
  *
  * @apiParam {String} packages the list of packages that the local help function of rstudio found a hit in
  * @apiParam {String} topic_names the list of topicnames that the local help function found a hit for
  */
  normalHelp : function(req,res){
    //parse parameters
    var packageName = req.param('packages');
    if(typeof packageName != "undefined" && packageName.length>0){
      packageNames= packageName.split(",");
    }
    else{
      packageNames =null;
    }    
    var topicName = req.param('topic_names');
    if(typeof topicName != "undefined" && topicName.length>0){
      topicNames= topicName.split(",");
    }
    else{
      topicNames =null;
    }
    var topic = req.param("topic");
    //if topicNames and packageNames where found by the local help function, search for it in the specified packages (might be none)
    if(packageNames != null && topicNames != null){
      return RStudioService.helpFindByTopicsAndPackages(topic,topicNames,packageNames).then(function(json){
        if(json.length == 0){
          //with no results : fuzzy search
          return ElasticSearchService.helpSearchQuery(topic,['aliases'],true,2).then(function(json){
            return res.ok(json,'rStudio/topic_not_found.ejs');
          });
        }
        //1 result : redirect to result
        if(json.length == 1){
          return res.ok(json[0],'topic/show.ejs');
        }
        else{
          //multiple results :show options
          return res.ok(json,'rStudio/list_options.ejs');
        }
      });
    }
    //if no results where found by the local help function
    else{
      return RStudioService.helpFindByAlias(topic).then(function(json){
        if(json.length == 0){
          //with no results : fuzzy search
          return ElasticSearchService.helpSearchQuery(topic,['aliases'],true,2).then(function(json){
            return res.ok(json,'rStudio/topic_not_found.ejs');
          });
        }
        //1 result : redirect to result
        if(json.length == 1){
          return res.ok(json[0],'topic/show.ejs');
        }
        else{
          //multiple results :show options
          return res.ok(json,'rStudio/list_options.ejs');
        }
      });
    }
  },

  /**
  * @api {post} /rstudio/package/:packageName
  * @apiName Redirects to a package given the packageName
  * @apiGroup Rstudio
  *
  * @apiParam {String} packageName the name of the package to redirect to
  */

  findPackage:function(req,res){
    var package = req.param("packageName");
    return RStudioService.findLatestVersion(package).then(function(version){
      if(version === null) return res.ok([],'rStudio/package_not_found.ejs');
      else {
        return res.rstudio_redirect(301,'/packages/'+package+'/versions/'+version.version);
      }
    })
    .catch(function(err){
      console.log(err.message);
    });

  },
  /**
  * @api {post} /rstudio/package/:packageName
  * @apiName Redirects to a package given the packageName
  * @apiGroup Rstudio
  *
  * @apiParam {String} matching_packages a list of matching packages for the query in Rstudio
  * @apiParam {String} matching_titles a list of matching titles for the query in Rstudio
  * @apiParam {String} query the query that was executed in Rstudio
  * @apiParam {String} fields the fields the query was executed on in Rstudio
  * @apiParam {String} fuzzy "fuzzy" if the query was a fuzzy query, else "regexp" for a regexp query
  * @apiParam {String} ignore_case if the local query ignored cases or not, "TRUE" if true, else "FALSE"
  */
  searchHelp:function(req,res){
    //parse parameters
    var packageName = req.param('matching_packages');
    if(typeof packageName != "undefined" && packageName.length>0){
      packageNames= packageName.split(",");
    }
    else{
      packageNames =null;
    }    
    var topicName = req.param('matching_titles');
    if(typeof topicName != "undefined" && topicName.length>0){
      topicNames= topicName.split(",");
    }
    else{
      topicNames =null;
    } 
    var pattern = req.param("query");
    var fields = req.param("fields");
    fields = fields.split(",");
    var fuzzy = req.param("type");
    if(fuzzy == "fuzzy"){
      fuzzy = true;
    }
    else{
      fuzzy = false;
    }
    var max_dist = 2    ;
    var ignore_case = req.param("ignore_case");
    if(ignore_case == "TRUE"){
      ignore_case = true;
    }
    else{
      ignore_case = false;
    }
    if(topicNames== null || packageNames == null){
      //the local help found no search
      ElasticSearchService.helpSearchQuery(pattern,fields,fuzzy,max_dist,ignore_case).then(function(json){
        return res.ok(json,'rStudio/list_options.ejs');
      })
    }
    else{
      return RStudioService.helpFindByTopicsAndPackages(topicNames,packageNames).then(function(json){
        if(json.length == 0){
          //with no results : fuzzy search, this only happens when the user has packages installed that are not on Rdocumentation
          return ElasticSearchService.helpSearchQuery(pattern,fields,fuzzy,max_dist,ignore_case).then(function(json){
            return res.ok(json,'rStudio/topic_not_found.ejs');
          });
        }
        //1 result : redirect to result
        if(json.length == 1){
          return res.ok(json[0],'topic/show.ejs');
        }
        else{
          //multiple results :show options
          return res.ok(json,'rStudio/list_options.ejs');
        }
      });
    }
    

  },
  makeDefault:function(req,res){
    res.ok([],'rStudio/make_default.ejs')
  },
  redirect:function(req,res){
    res.redirect(req._parsedOriginalUrl.path.substring(5,req._parsedOriginalUrl.path.length));
  }
};
