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

  var fromRstudio = req.headers['x-rstudio-ajax'] === 'true';
  var urlParams= ['viewer_pane'].map(function(p) {
    return req.param(p) ? p + '=' + encodeURIComponent(req.param(p)) : '';
  }).filter(function(p) {
    return p !== '';
  }).join('&');
  if(uri.indexOf('?')>0){
    var redirectURL = uri.substring(0,uri.indexOf('?')) 
  }
  else{
    var redirectURL = uri
  }
  

  sails.log.silly('res.restudio_redirect() :: Sending '+code+ ' (redirect) response');

  if(fromRstudio) {
    res.location(redirectURL);
    res.set('X-RStudio-Redirect', redirectURL);
    res.json({ status: 'success'});
  } else {
    res.redirect(code,uri+"?"+ urlParams);
  }

};
