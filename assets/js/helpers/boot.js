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
    bootSource();
    bindUpvoteButton();
    window.bindFade();
    window.counter();
    window.dcFooter();
    hljs.initHighlighting.called = false;
    hljs.initHighlighting();
    rdl.initRDocsLight(document.getElementById('content'));
    rdl.setTopOffset(0);
  };

})($jq);

