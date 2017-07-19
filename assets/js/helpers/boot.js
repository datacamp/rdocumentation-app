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
    window.dcFooter();
    hljs.initHighlighting.called = false;
    hljs.initHighlighting();
    rdl.initRDocsLight({
      container: document.getElementById('content'),
      showTopicUsageSection: true,
      showTopicArgumentsSection: true,
    });
  };

})($jq);

