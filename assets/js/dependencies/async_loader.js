$(function() {
  if($.urlParam('viewer_pane') === '1'){
    var $pageBody = $('body');

    // Helper function to grab new HTML
    // and replace the content
    function replacePage(url) {
      $.ajax({
        type: 'GET',
        url: 'https://rdocs-v2.herokuapp.com' + url,
        cache: false,
        dataType: 'html'
      })
      .done( function(html) {
        $pageBody.html(html);
        bindGlobalClickHandler()
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