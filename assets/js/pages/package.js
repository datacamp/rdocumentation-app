(function($) {
  bootPackage = function(){
    window.triggerIcon();
    $("#show").click(function(){
      $("#show").hide();
      $("#details").find(".hidden").removeClass("hidden");
    });
    window.packageVersionToggleHandler();
    window.launchFullSearch();
    window.graphDownloadStatistics();
    if(typeof(Set) == "undefined"){
      $('#tab1').closest('li').hide();
      $('#tab2').closest('li').hide();
    }
    window.makeSlider();
    window.versionTooltip();
  };
  window.packageVersionToggleHandler = function() {
    $('#packageVersionSelect').bind('change',function(){
      var url = $(this).find('option:selected').data('uri');
      window.location.href = url;
    });

  };

  window.graphDownloadStatistics = function() {
    var getData = function(data_url, callback) {
      return $.get(data_url, callback);
    };

    nv.addGraph(function() {
        window.chart = nv.models.multiBarChart()
          .reduceXTicks(true)   //If 'false', every single x-axis tick label will be rendered.
          .rotateLabels(0)      //Angle to rotate x-axis labels.
          .showControls(true)   //Allow user to switch between 'Grouped' and 'Stacked' mode.
          .groupSpacing(0.1)    //Distance between each group of bars.
          .stacked(true)
          .height(400)
          .x(function (d){
            return d.timestamp;
          })
          .y(function (d){
            return d.count;
          })
        ;

        window.chart.xAxis
            .tickFormat(function(d) { return d3.time.format('%x')(new Date(d)); });

        window.chart.yAxis
            .tickFormat(d3.format(',.1f'));

        if($('#chart').data('url')) {
          getData($('#chart').data('url'), function(data) {
            var direct_serie = {
              key: "Direct downloads",
              values: data.filter(function(e){
                return e.key=="direct_downloads";
              })
            };
            var indirect_serie = {
              key: "Indirect downloads",
              values: data.filter(function(e){
                return e.key=="indirect_downloads";
              })
            };
            $('#chart').show();
            d3.select('#chart svg')
              .datum([direct_serie,indirect_serie])
              .call(window.chart);
          });
          nv.utils.windowResize(window.chart.update);
        }
        else if($('#bioc_chart').data('url')) {
          getData($('#bioc_chart').data('url'), function(data) {
            var serie = {
              key: "Downloads",
              values: data
            };
            $('#bioc_chart').show();
            d3.select('#bioc_chart svg')
              .datum([serie])
              .call(window.chart);
          });
          nv.utils.windowResize(window.chart.update);
        }
        return window.chart;
    });

  };

  window.makeSlider = function(){
    $(".slider-icon").click(function(){
      var slider = $(".slider-icon");
      if(slider.hasClass("fa-angle-down")){
        slider.removeClass("fa-angle-down");
        slider.addClass("fa-angle-up");
        $(".sliding").slideDown();
        if(!$("#chart svg").hasClass("nvd3-svg")){
          window.graphDownloadStatistics();
        }
      }else{
        slider.removeClass("fa-angle-up");
        slider.addClass("fa-angle-down");
        $(".sliding").slideUp();
      }
    });
  };

  window.bindUpvoteButton = function() {
    $('#upvoteButton').click(function(e) {
      e.preventDefault();
      var $this = $(this);
      var actionUrl = $(this).data('action');
      $.ajax({
        type: 'POST',
        url: actionUrl,
        headers: {
          Accept : "text/html; charset=utf-8",
          "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
        },
        contentType:"application/x-www-form-urlencoded"
      }).then(function(response) {
        $('.star-count--number').html(response.newCount);
        $this.attr('upvoted', response.star !== 'deleted');
      });
    });
    $("#openModalUpvote").bind('modal:ajax:complete',function(){
      var callback = function(){
        var auth = $(".authentication--form").serialize()
        $.post("/modalLogin",auth,function(json){
          var status = json.status;
          if(status === "success"){
            $.post($('#openModalUpvote').data('action'), function(response) {
              location.reload();
            });
          }else if(status === "invalid"){
            if($(".modal").find(".flash-error").length === 0){
            $(".modal").prepend("<div class = 'flash flash-error'>Invalid username or password.</div>");
          }
          }
        });
      };
      $("#modalLoginButton").click(function(e){
        e.preventDefault();
        callback()
      });
      $("#username").keypress(function(e){
        if(e.which == 13){
          callback();
        }
      });
      $("#password").keypress(function(e){
        if(e.which == 13){
          callback();
        }
      });
    });
  };

  window.versionTooltip = function () {
    $(".package--version--v").tooltip({
      placement: 'right'
    });
  }

  window.triggerIcon = function(){
    $("table").bind("sortEnd",function(){
      $("thead td").each(function(){
        var current = $(this);
        if(current.hasClass("tablesorter-headerDesc")){
          current.find("i").removeClass("fa-sort");
          current.find("i").removeClass("fa-sort-asc");
          current.find("i").addClass("fa-sort-desc");
        }
        if(current.hasClass("tablesorter-headerAsc")){
          current.find("i").removeClass("fa-sort");
          current.find("i").removeClass("fa-sort-desc");
          current.find("i").addClass("fa-sort-asc");
        }
        if(current.hasClass("tablesorter-headerUnSorted")){
          current.find("i").removeClass("fa-sort-desc");
          current.find("i").removeClass("fa-sort-asc");
          current.find("i").addClass("fa-sort");
        }
      });
    });
  };
})($jq);
