$(function() {
  if($.urlParam('viewer_pane') === '1'){
    console.log('*********************** AJAX MODE ***********************');
    var $pageBody = $('body');

    function rerenderBody(html){
      var body = html.replace(/^[\S\s]*<body[^>]*?>/i, "").replace(/<\/body[\S\s]*$/i, "");
      $pageBody.html(body);
      bindGlobalClickHandler();
      bindGlobalFormHandler();
    }

    // Helper function to grab new HTML
    // and replace the content
    function replacePage(url) {
      $.ajax({
        type: 'GET',
        url: 'https://rdocs-v2.herokuapp.com' + url,
        cache: false,
        dataType: 'html',
        xhrFields: {
          withCredentials: true
        }
      })
      .done(rerenderBody);
    };

    // Intercept all link clicks
    function bindGlobalClickHandler(){
      $('a').click(function(e) {
        e.preventDefault();
        // Grab the url from the anchor tag
        var url = $(this).attr('href');
        replacePage(url);
      });
    }

    function bindGlobalFormHandler(){
      // Intercept form submissions
      $('form').on('submit', function() {
        $.ajax({
            url: $(this).attr('action'),
            type: $(this).attr('method'),
            dataType: 'html',
            cache: false,
            data: $(this).serialize(),
            xhrFields: {
              withCredentials: true
            }
        }).done(rerenderBody);
        return false;
      });
    }

    bindGlobalClickHandler();
    bindGlobalFormHandler();
  }


});