(function($){

  $(window).on("load", function() {
    window.boot();
  });

  window.boot = function() {
    bootDownloadStats();
    bootListTableFiltering();
    bootRunExample();
    bootToggle();
    bootCollaborator();
    bootTaskViews();
    bootRstudioNavigator();
    bootAsyncLoader();
    bootPackage();
    trendingPackagesLastWeek();
    trendingKeywords(); 
    bootTopic();
    bootUser();
    bindUpvoteButton();
    window.bindFade();
  };

})($jq);

