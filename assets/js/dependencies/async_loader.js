$(function() {
  $.urlParam = function(name){
      var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
      if (results==null){
         return null;
      }
      else{
         return results[1] || 0;
      }
  }

  if($.urlParam('viewer_pane') === '1'){
    console.log('*********************** AJAX MODE ***********************');
    var $pageBody = $('body');

    // Intercept all link clicks
    window.asyncClickHandler = function(e) {
      console.log('handler called')
      e.preventDefault();
      // Grab the url from the anchor tag
      var url = $(this).attr('href');
      replacePage(url);
    }

    var bindGlobalClickHandler = function(){
      $('a:not(.js-external)').unbind('click', window.asyncClickHandler);
      $('a:not(.js-external)').bind('click', window.asyncClickHandler);
    }

    function rerenderBody(html){
      var body = html.replace(/^[\S\s]*<body[^>]*?>/i, "").replace(/<\/body[\S\s]*$/i, "");
      $pageBody.html(body);
      bindGlobalClickHandler();
    }

    // Helper function to grab new HTML
    // and replace the content
    function replacePage(url) {
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



    // function bindGlobalFormHandler(){
    //   // Intercept form submissions
    //   $('form').on('submit', function() {
    //     $.ajax({
    //         url: $(this).attr('action'),
    //         type: $(this).attr('method'),
    //         dataType: 'html',
    //         cache: false,
    //         data: $(this).serialize(),
    //         xhrFields: {
    //           withCredentials: true
    //         }
    //     }).done(rerenderBody);
    //     return false;
    //   });
    // }

    bindGlobalClickHandler();
  }


});