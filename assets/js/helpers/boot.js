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
    $("table.packagetable").tablesorter({
          textExtraction: function (node){
            if($(node).find(".rating").length>0){
              return ($(node).find(".rating").data('rating'));
            }else if($(node).find(".percentile-task").length>0){
              return $(node).find(".percentile-task").data('percentile');
            }
            return $(node).text();
          }
    });
    window.triggerIcon();
  });
  bindUpvoteButton();
  window.bootTopic();
});
