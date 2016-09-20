(function($) {
  window.getPath = function(loc) {
    var lastIndex = loc.length;
    var firstIndex = (loc.lastIndexOf('/') + 1) || 0;
    var pathName = loc.substring(firstIndex, lastIndex);
    return pathName;
  };

  window.urlParam = function(name){
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
  };

  window.bindFade = function () {
    $('.fading-text').unbind().click(function() {
      var $this = $(this);
      $this.removeClass('fading-text');
      $this.addClass('expanded');
      $this.unbind().click(function() {
        $this.addClass('fading-text');
        $this.removeClass('expanded');
        window.bindFade();
      });
    });
  };

  window.getCurrentPath = function() {
    return $('body').attr('url') ? getPath($('body').attr('url')) : getPath(window.location.pathname);
  };

  window.counter = function () {
    var options = {
      useEasing : true,
      useGrouping : true,
      separator : ',',
      decimal : '.',
      prefix : '',
      suffix : ''
    };
    $(".counter").each(function() {
      var $this = $(this);
      var count = $this.data("count");
      var counter = new CountUp(this, 0, count, 0, 2.5, options);
      counter.start();
    });
  };


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
})($jq);
