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
    bootTrending();
    bindUpvoteButton();
    window.bindFade();
  };

})($jq);

