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

    function rerenderBody(html){
      var body = html.replace(/^[\S\s]*<body[^>]*?>/i, "").replace(/<\/body[\S\s]*$/i, "");
      $pageBody.html(body);
      window.bindGlobalClickHandler();
      window.searchHandler(jQuery);
      window.packageVersionToggleHandler(jQuery);
      MathJax.Hub.Queue(["Typeset",MathJax.Hub])
    }

    window.bindGlobalClickHandler = function(){
      $('a:not(.js-external)').unbind('click', window.asyncClickHandler);
      $('a:not(.js-external)').bind('click', window.asyncClickHandler);
      $( "form" ).submit(function( event ) {
          event.preventDefault();
          console.log( $( this ).serialize() );
          console.log($( "form" ));
          var action = $("form")[0].action;
          var type = "GET";
          if (typeof $("form")[1] != 'undefined'){
            action = $("form")[1].action;
            type = "POST";
          }
          $.ajax({
            type: type,
            url: action,
            data: $( this ).serialize(),
            contentType:"application/x-www-form-urlencoded",
            crossDomain:true,
            xhrFields: {
              withCredentials: true
            }
          }).then(rerenderBody);
      });
    };

    // Helper function to grab new HTML
    // and replace the content
    window.replacePage = function(url) {
      $.ajax({
        type: 'GET',
        url: 'http://localhost:1337' + url + '?viewer_pane=1',
        cache: false,
        dataType: 'html',
        xhrFields: {
          withCredentials: true
        }
      })
      .done(rerenderBody);
    };

    window.bindGlobalClickHandler();
  }


});