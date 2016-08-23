function getPath(loc) {
  var lastIndex = loc.length;
  var firstIndex = (loc.lastIndexOf('/') + 1) || 0;
  var pathName = loc.substring(firstIndex, lastIndex);
  return pathName;
}

function urlParam(name){
  var url;
  if(name === 'viewer_pane' || name === 'RS_SHARED_SECRET' || name === 'Rstudio_port' || name === 'username' || name === 'password' || name === 'history') {
    url = window.location.href;
  } else if ( urlParam('viewer_pane') !== '1') {
    url = window.location.href;
  } else {
    url = $('body').attr('url');
  }
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(url);
  if (results===null) {
    return null;
  }
  else {
    return results[1] || 0;
  }
}


function getCurrentPath() {
  return $('body').attr('url') ? getPath($('body').attr('url')) : getPath(window.location.pathname);
}


window.activateTabs = function(id) {
  $(id).find('a').prop('href', function(){
    return window.location.href + $(this).attr('href');
  }).end().tabs({
    active:0,
    'beforeLoad':function(event,ui){
      event.preventDefault();
    }
  });
};
