(function($){

  $(window).on("load", function() {
    window.boot();
  });

  window.boot = function() {
    bootDownloadStats();
    bootListTableFiltering();
    bootToggle();
    bootCollaborator();
    bootTaskViews();
    bootRstudioNavigator();
    bootAsyncLoader();
    bootPackage();
    bootExamples();
    bootTrending();
    bootUser();
    bindUpvoteButton();
    window.bindFade();
    window.counter();
    hljs.initHighlighting.called = false;
    hljs.initHighlighting();
  };

})($jq);

