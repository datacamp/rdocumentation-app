(function($) {
 bootTaskViews = function() {
    $( ".js-display-list" ).click(function(e) {
      e.preventDefault();
      $(this).parent().find(".js-view-package-list").toggle();
    });
  };
})($jq);
