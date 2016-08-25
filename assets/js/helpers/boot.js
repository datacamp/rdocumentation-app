(function($){
  $(window).on("load", function() {
    window.boot()
  })
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
    window.trendingPackagesLastWeek();
    trendingKeywords(); 
    // add parser through the tablesorter addParser method
    $.getScript("https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.js",function(){
      window.bootTopic();
      $.getScript("https://cdn.mathjax.org/mathjax/latest/MathJax.js",function(){
        MathJax.Hub.Config({
            jax: ["input/TeX","input/MathML","input/AsciiMath","output/CommonHTML"],
            extensions: ["tex2jax.js","mml2jax.js","asciimath2jax.js","MathMenu.js","MathZoom.js","AssistiveMML.js"],
            TeX: {
              extensions: ["AMSmath.js","AMSsymbols.js","noErrors.js","noUndefined.js"]
            },
            tex2jax: {
              skipTags:["code"]
            }
          });
        MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
      })
    })
    bindUpvoteButton();
    window.bindFade();
  }
})($jq);

