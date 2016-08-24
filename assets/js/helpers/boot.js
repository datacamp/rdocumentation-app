(function($) {
  $(document).ready(function() {
    $('.download-task').each(function(elem) {
        var $self = $(this);
        var url = $self.data('url');
        $.get(url, function(data){
          $self.find(".total").text(data.totalStr);
          $self.find(".deps").text(data.indirectDownloadsStr);
          $self.find(".indeps").text(data.directDownloadsStr);
          $(".direct-downloads").attr("title","Monthly downloads are direct downloads. The package also had " + data.indirectDownloadsStr + " dependent downloads for a total of " + data.totalStr +".");
          $(".distinct-ip-downloads").attr("title","Monthly downloads are downloads from distinct ip's.");
          $(".fa-info-circle").tooltip({
            placement: 'bottom'
          });
          $('.downloads').css({'visibility': 'visible'});
        });
    });
    $(".top10").find(".fa-info-circle").tooltip({placement: "bottom"});
    $.getScript("http://code.jquery.com/ui/1.12.0/jquery-ui.js", function(){
      window.triggerIcon();
      $("#show").click(function(){
        $("#show").hide();
        $("#details").find(".hidden").removeClass("hidden");
      });
      window.packageVersionToggleHandler();
      window.activateTabs("#tabs");
      window.launchFullSearch();
      if(typeof(Set) == "undefined"){
        $('#tab1').closest('li').hide();
        $('#tab2').closest('li').hide();
      }
    });
    $.getScript("http://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js",function(){
      $.getScript("http://cdnjs.cloudflare.com/ajax/libs/nvd3/1.8.3/nv.d3.min.js",function(){
        window.bindTabs();
        window.makeSlider();
        window.trendingPackagesLastWeek();
        trendingKeywords();
        dependencyGraph();
      });
    });
    $.getScript("http://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.27.2/js/jquery.tablesorter.js",function(){
      // add parser through the tablesorter addParser method
      $.tablesorter.addParser({
          // set a unique id
          id: 'rating',
          is: function(s) {
              // return false so this parser is not auto detected
              return false;
          },
          format: function(s) {
              // format your data for normalization
              return parseFloat(s);
          },
          // set type, either numeric or text
          type: 'numeric'
      });
      $("table").tablesorter({
            headers: {
                2: {
                    sorter:'rating'
                }
            },
            textExtraction: function (node){
              if($(node).find("i").length>0){
                var stars = $(node).find("i");
                //console.log(stars);
                var count = 0.0;
                stars.each(function(i){
                  if($(this).hasClass("fa-star")){
                    count += 1.0;
                  }else if($(this).hasClass("fa-star-half-o")){
                    count += 0.5;
                  }
                });
                return ""+count;
              }
              return $(node).text();
            }
      });
    });
    bindUpvoteButton();
    window.bindFade();
    window.bootTopic();
  });
})($jq);
