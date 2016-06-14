$(function() {
  if($.urlParam('viewer_pane') === '1'){
    console.log('*********************** AJAX MODE ***********************');
    var $pageBody = $('body');

    // Helper function to grab new HTML
    // and replace the content
    function replacePage(url) {
      $.ajax({
        type: 'GET',
        xhr: function() {
          var xhr = jQuery.ajaxSettings.xhr();
          var setRequestHeader = xhr.setRequestHeader;
          xhr.setRequestHeader = function(name, value) {
            if (name == 'X-Requested-With') return;
            setRequestHeader.call(this, name, value);
          }
          return xhr;
        },
        url: 'https://rdocs-v2.herokuapp.com' + url,
        cache: false,
        dataType: 'html'
      })
      .done( function(html) {
        var body = html.replace(/^[\S\s]*<body[^>]*?>/i, "").replace(/<\/body[\S\s]*$/i, "");
        console.log(body)
        $pageBody.html(body);
        bindGlobalClickHandler();
      });
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

    bindGlobalClickHandler();
  }
});