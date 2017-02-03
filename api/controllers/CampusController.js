/**
 * CampusController
 *
 * @description :: Server-side logic for the integration of the campus-app with Rdocs
 */

module.exports = {

  /**
  * @api {get} /campus/help
  * @apiName Get help in the campus-app via Rdocumentation-> needs to redirect or do an ajax request to retrieve the credentials
  * @apiGroup Rstudio
  *
  * @apiParam {String} query
  */
  help : function(req,res){
    res.ok({package:req.param("package"),topic:req.param("topic")},'campus/help');
  },

  path: function(req, res) {
    res.ok({path:req.param("path")},'campus/help');
  }

};
