/**
 * 303 (See Other) Handler for Rstudio-api (passes parameters)
 *
 * Usage:
 * return res.rstudio_redirect(uri)
 *
 * e.g.:
 * ```
 * return res.rstudio_redirect(uri)
 * ```
 *
 * NOTE:
 * This response is needed if the viewer_pane parameter, the Rstudio_port and/or the session_shared_secret for Rstudio or important
 * This is for example the case when refering to topics, as topic/show.ejs has viewer_pane-specifid code.
 */

 module.exports = function rstudio_redirect(code,uri) {

// Get access to `req`, `res`, & `sails`
  var req = this.req;
  var res = this.res;
  var sails = req._sails;

  var urlParams="";

  urlParams='?viewer_pane='+encodeURIComponent(req.param("viewer_pane"))+
    '&Rstudio_port='+encodeURIComponent(req.param('Rstudio_port'))+
    "&RS_SHARED_SECRET="+encodeURIComponent(req.param('RS_SHARED_SECRET'))+
    "&rstudio_layout="+encodeURIComponent(req.param('rstudio_layout'));

  sails.log.silly('res.restudio_redirect() :: Sending '+code+ ' (redirect) response');
  res.redirect(code,uri+urlParams);
};
