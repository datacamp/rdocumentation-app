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
  * @apiGroup Topic
  *
  * @apiParam {String} packages the list of packages that the local help function of rstudio found a hit in
  * @apiParam {String} topic_names the list of topicnames that the local help function found a hit for
  */
  normalHelp : function(req,res){
    console.log(req.signedCookies);
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
    var rStudioPort = req.param("Rstudio_port");
    var rStudioShared = req.param("XS_Secret");
    console.log(packageNames);
    console.log(topicNames);
    //if topicNames and packageNames where found by the local help function, search for it in the specified packages (might be none)
    if(packageNames != null && topicNames != null){
      return RStudioService.helpFindByTopicsAndPackages(topicNames,packageNames).then(function(json){
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
      console.log("checking with rstudio")
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

  findPackage:function(req,res){
    console.log(req.signedCookies);
    var package = req.param("packageName");
    var rStudioPort = req.param("Rstudio_port");
    var rStudioShared = req.param("XS_Secret");
    console.log(package);
    return RStudioService.findPackage(package).then(function(json){
      if(json.length == 0){
        //no fuzzy search, because you should have found what you were searching for
        return res.ok(json,'rStudio/topic_not_found.ejs');
      }
      else{
        //multiple results :show options
        return res.ok(json,'package_version/show.ejs');
      }
    });

  },

  searchHelp:function(req,res){
    console.log(req.signedCookies);
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
    var rStudioPort = req.param("Rstudio_port");
    var rStudioShared = req.param("XS_Secret");
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
      ElasticSearchService.helpSearchQuery(pattern,fields,fuzzy,max_dist,ignore_case).then(function(json){
        return res.ok(json,'rStudio/list_options.ejs');
      })
    }
    else{
      return RStudioService.helpFindByTopicsAndPackages(topicNames,packageNames).then(function(json){
        if(json.length == 0){
          //with no results : fuzzy search
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
  redirect:function(req,res){
    res.redirect(req._parsedOriginalUrl.path.substring(5,req._parsedOriginalUrl.path.length));
  }
};
