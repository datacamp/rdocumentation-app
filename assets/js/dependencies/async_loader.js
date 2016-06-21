
$(function() {
  if(urlParam('viewer_pane') === '1'){
    console.log('*********************** AJAX MODE ***********************');
    var $pageBody = $('body');

    // Intercept all link clicks
    window.asyncClickHandler = function(e) {
      e.preventDefault();
      // Grab the url from the anchor tag
      var url = $(this).attr('href');
      window.replacePage(url);
    }

    var bindGlobalClickHandler = function(){
      $('a:not(.js-external)').unbind('click', window.asyncClickHandler);
      $('a:not(.js-external)').bind('click', window.asyncClickHandler);
    }

    function rerenderBody(html){
      var body = html.replace(/^[\S\s]*<body[^>]*?>/i, "").replace(/<\/body[\S\s]*$/i, "");
      $pageBody.html(body);
      bindGlobalClickHandler();
      window.searchHandler(jQuery);
      window.packageVersionToggleHandler(jQuery);
      MathJax.Hub.Queue(["Typeset",MathJax.Hub])
    }

    // Helper function to grab new HTML
    // and replace the content
    window.replacePage = function(url) {
      $.ajax({
        type: 'GET',
        url: 'https://rdocs-v2.herokuapp.com' + url + '?viewer_pane=1',
        cache: false,
        dataType: 'html',
        xhrFields: {
          withCredentials: true
        }
      })
      .done(rerenderBody);
    };

    bindGlobalClickHandler();
  }


});