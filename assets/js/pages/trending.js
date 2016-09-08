(function($) {
  window.packagesPerRange = function(){
  	var getData = function(data_url, callback) {
      return $.get(data_url, callback);
    };

    nv.addGraph(function() {
    	var chart = nv.models.multiBarChart()
          .x(function (d){
            return d.range;
          })
          .y(function (d){
            return d.count;
          })
          .reduceXTicks(true)   //If 'false', every single x-axis tick label will be rendered.
          .rotateLabels(0)      //Angle to rotate x-axis labels.
          .showControls(false)   //Allow user to switch between 'Grouped' and 'Stacked' mode.
          .groupSpacing(0.1)    //Distance between each group of bars.
          .showLegend(false)
          .color(['#33aacc']);

        if($('#packagesperrange').data('url')){
          getData($('#packagesperrange').data('url'), function(data) {
            $('#packagesperrange').show();
            d3.select('#packagesperrange svg')
              .datum([{
                key: "Packages",
                values: data
              }])
              .call(chart);
          });
        }

        nv.utils.windowResize(chart.update);

        return chart;
    });
  };

  window.trendingKeywords = function(){
  	var getData = function(data_url, callback) {
      return $.get(data_url, callback);
    };

    nv.addGraph(function() {
    	var chart = nv.models.discreteBarChart()
          .x(function (d){
            return d["key"];
          })
          .y(function (d){
            return d.doc_count;
          })
          .staggerLabels(true)
          .color(['#33aacc'])
        ;

        if($('#topkeywords').data('url')){
          getData($('#topkeywords').data('url'), function(data) {
            $('#topkeywords').show();
            d3.select('#topkeywords svg')
              .datum([{
              	key: "Top keywords",
              	values: data
              }])
              .call(chart);
          });
        }

        chart.discretebar.dispatch.on("elementClick", function(e) {
  		    var url = "/search?q="+e.data.key;
  		    document.location = url;
  		});

        nv.utils.windowResize(chart.update);

        return chart;
    });
  };

  window.dependencyGraph = function(){
  	var getData = function(data_url, callback) {
      return $.get(data_url, callback);
    };
  	nv.addGraph({
          generate: function() {
              var width = nv.utils.windowSize().width,
                  height = nv.utils.windowSize().height;
              var d3Colors = d3.scale.category20();
              var chart = nv.models.forceDirectedGraph()
                  .width(width)
                  .height(height)
                  .margin({top: 60, right: 150, bottom: 60, left: 60})
                  .color(function(d) { return d3Colors(d.group) })
                  .nodeExtras(function(node) {
                    node
                      .append("text")
                      .attr("dx", 12)
                      .attr("dy", ".35em")
                      .text(function(d) { return d.name });
                  });
              if($('#dependencygraph').data('url')){
                getData($('#dependencygraph').data('url'), function(data) {
                  $('#dependencygraph').show();
                  d3.select('#dependencygraph svg')
                        .datum(data)
                        .call(chart);
                });
              }
              return chart;
      },
          callback: function(graph) {
              window.onresize = function() {
                  var width = nv.utils.windowSize().width,
                      height = nv.utils.windowSize().height,
                      margin = graph.margin();
                  graph.width(width).height(height);
                  d3.select('#dependencygraph svg')
                      .attr('width', width)
                      .attr('height', height)
                      .call(graph);
              };
          }
      });
  };

  bootTrending = function(){
    packagesPerRange();
    trendingKeywords();
    if(typeof(Set) !== "undefined"){
      dependencyGraph();
    }
    $(".trends .fa-info-circle").tooltip({placement:"bottom"});
    if(getCurrentPath().indexOf('trends')==0) {
      var page1 = parseInt(urlParam("page1")) || 1;
      var sort1 = urlParam("sort1") || "direct";
      var page2 = parseInt(urlParam("page2")) || 1;
      var sort2 = urlParam("sort2") || "total";
      var page3 = parseInt(urlParam("page3")) || 1;
      var page4 = parseInt(urlParam("page4")) || 1;
      window.rebindTrending(page1,sort1,page2,sort2,page3,page4);
    }
  };

  window.reloadMostPopular = function(page1,sort1,page2,sort2,page3,page4){
    $.ajax({
      url : "/api/trends/mostpopular?page=" + page1 + "&sort=" + sort1
    }).done(function(result){
      $("#top10downloads tbody").empty();
      result.results.forEach(function(result,i){
        $("#top10downloads tbody").append("<tr><td>"+((page1-1)*10+i+1)+". "+"<a href = '/packages/"+result.package_name+"'>"+result.package_name+"</a></td><td>"+result.directStr+"</td><td>"+result.indirectStr+"</td><td>"+result.totalStr+ "</td></tr>");
      });
      $(document).trigger('content-changed');
    });
    window.rebindTrending(page1,sort1,page2,sort2,page3,page4);
  };

  window.reloadTopCollaborators = function(page1,sort1,page2,sort2,page3,page4){
    $.ajax({
      url : "/api/trends/topcollaborators?page=" + page2 + "&sort=" + sort2
    }).done(function(result){
      $("#top10maintainers tbody").empty();
      result.results.forEach(function(result,i){
        $("#top10maintainers tbody").append("<tr><td>"+((page2-1)*10+i+1)+". "+"<a href = '/collaborators/"+encodeURIComponent(result.name)+"'>"+result.name+"</a></td><td>"+result.directStr+"</td><td>"+result.indirectStr+"</td><td>"+result.totalStr+ "</td></tr>");
      });
      $(document).trigger('content-changed');
    });
    window.rebindTrending(page1,sort1,page2,sort2,page3,page4);
  };

  window.reloadNewPackages = function(page1,sort1,page2,sort2,page3,page4){
    $.ajax({
      url : "/api/trends/newpackages?page=" + page3
    }).done(function(result){
      $("#top10new tbody").empty();
      result.newArrivals.forEach(function(arrival){
        $("#top10new tbody").append("<tr><td><a href = '/packages/"+arrival.package_name+"'>"+arrival.package_name+"</a></td><td><p class = 'info-trends'>"+arrival.rel+"</p></td></tr>");
      });
      $(document).trigger('content-changed');
    });
    window.rebindTrending(page1,sort1,page2,sort2,page3,page4);
  };

  window.reloadNewVersions = function(page1,sort1,page2,sort2,page3,page4){
    $.ajax({
      url : "/api/trends/newversions?page=" + page4
    }).done(function(result){
      $("#top10renew tbody").empty();
      result.newVersions.forEach(function(arrival){
        var release = new Date(arrival.rel);
        $("#top10renew tbody").append("<tr><td><a href = '/packages/"+arrival.package_name+"'>"+arrival.package_name+"</a></td><td><p class = 'info-trends'>"+arrival.rel+"</p></td></tr>");
      });
      $(document).trigger('content-changed');
    });
    window.rebindTrending(page1,sort1,page2,sort2,page3,page4);
  };

  window.updateTrendingHistory = function(page1,sort1,page2,sort2,page3,page4){
    var url = window.location.protocol+ "//" +
     window.location.host +
     window.location.pathname +
     '?page1=' + page1 +
     "&sort1=" + sort1 + 
     '&page2=' + page2 +
     "&sort2=" + sort2 +
     '&page3=' + page3 +
     '&page4=' + page4;
     history.pushState({page1: page1,sort1: sort1, page2: page2,sort2: sort2, page3: page3, page4: page4}, "Trends", url);
  };

  window.onpopstate = function(event) {
    if($(".trends")[0]){
      reloadMostPopular(event.state.page1,event.state.sort1, event.state.page2,event.state.sort2, event.state.page3, event.state.page4);
      reloadTopCollaborators(event.state.page1,event.state.sort1, event.state.page2,event.state.sort2, event.state.page3, event.state.page4);
      reloadNewPackages(event.state.page1,event.state.sort1, event.state.page2,event.state.sort2, event.state.page3, event.state.page4);
      reloadNewVersions(event.state.page1,event.state.sort1, event.state.page2,event.state.sort2, event.state.page3, event.state.page4);
    }
  };

  window.rebindTrending = function(page1,sort1,page2,sort2,page3,page4) {
    if(page1 <= 1){
      $("#top10downloads .previous").hide();
    }else{
      $("#top10downloads .previous").show();
    }
    $("#top10downloads .previous").unbind().click(function(){
      window.updateTrendingHistory(page1-1,sort1,page2,sort2,page3,page4);
      window.reloadMostPopular(page1-1,sort1,page2,sort2,page3,page4);
    });
    $("#top10downloads .next").unbind().click(function(){
      window.updateTrendingHistory(page1+1,sort1,page2,sort2,page3,page4);
      window.reloadMostPopular(page1+1,sort1,page2,sort2,page3,page4);
    });
    if(page2 <= 1){
      $("#top10maintainers .previous").hide();
    }else{
      $("#top10maintainers .previous").show();
    }
    $("#top10maintainers .previous").unbind().click(function(){
      window.updateTrendingHistory(page1,sort1,page2-1,sort2,page3,page4);
      window.reloadTopCollaborators(page1,sort1,page2-1,sort2,page3,page4);
    });
    $("#top10maintainers .next").unbind().click(function(){
      window.updateTrendingHistory(page1,sort1,page2+1,sort2,page3,page4);
      window.reloadTopCollaborators(page1,sort1,page2+1,sort2,page3,page4);
    });
    if(page3 <= 1){
      $("#top10new .previous").hide();
    }else{
      $("#top10new .previous").show();
    }
    $("#top10new .previous").unbind().click(function(){
      window.updateTrendingHistory(page1,sort1,page2,sort2,page3-1,page4);
      window.reloadNewPackages(page1,sort1,page2,sort2,page3-1,page4);
    });
    $("#top10new .next").unbind().click(function(){
      window.updateTrendingHistory(page1,sort1,page2,sort2,page3+1,page4);
      window.reloadNewPackages(page1,sort1,page2,sort2,page3+1,page4);
    });
    if(page4 <= 1){
      $("#top10renew .previous").hide();
    }else{
      $("#top10renew .previous").show();
    }
    $("#top10renew .previous").unbind().click(function(){
      window.updateTrendingHistory(page1,sort1,page2,sort2,page3,page4-1);
      window.reloadNewVersions(page1,sort1,page2,sort2,page3,page4-1);
    });
    $("#top10renew .next").unbind().click(function(){
      window.updateTrendingHistory(page1,sort1,page2,sort2,page3,page4+1);
      window.reloadNewVersions(page1,sort1,page2,sort2,page3,page4+1);
    });
    $("#top10downloads .direct").unbind().click(function(){
      var $this = $(this);
      if($this.find(".fa-sort-desc").length === 0){
      window.updateTrendingHistory(page1,"direct",page2,sort2,page3,page4);
      window.reloadMostPopular(page1,"direct",page2,sort2,page3,page4);
        $this.parent().find(".fa-sort-desc").removeClass("fa-sort-desc").addClass("fa-sort");
        $this.find(".fa-sort").removeClass("fa-sort").addClass("fa-sort-desc");
      }
    });
    $("#top10downloads .indirect").unbind().click(function(){
      var $this = $(this);
      if($this.find(".fa-sort-desc").length === 0){
      window.updateTrendingHistory(page1,"indirect",page2,sort2,page3,page4);
      window.reloadMostPopular(page1,"indirect",page2,sort2,page3,page4);
        $this.parent().find(".fa-sort-desc").removeClass("fa-sort-desc").addClass("fa-sort");
        $this.find(".fa-sort").removeClass("fa-sort").addClass("fa-sort-desc");
      }
    });
    $("#top10downloads .total").unbind().click(function(){
      var $this = $(this);
      if($this.find(".fa-sort-desc").length === 0){
      window.updateTrendingHistory(page1,"total",page2,sort2,page3,page4);
      window.reloadMostPopular(page1,"total",page2,sort2,page3,page4);
        $this.parent().find(".fa-sort-desc").removeClass("fa-sort-desc").addClass("fa-sort");
        $this.find(".fa-sort").removeClass("fa-sort").addClass("fa-sort-desc");
      }
    });
    $("#top10maintainers .direct").unbind().click(function(){
      var $this = $(this);
      if($this.find(".fa-sort-desc").length === 0){
      window.updateTrendingHistory(page1,sort1,page2,"direct",page3,page4);
      window.reloadTopCollaborators(page1,sort1,page2,"direct",page3,page4);
        $this.parent().find(".fa-sort-desc").removeClass("fa-sort-desc").addClass("fa-sort");
        $this.find(".fa-sort").removeClass("fa-sort").addClass("fa-sort-desc");
      }
    });
    $("#top10maintainers .indirect").unbind().click(function(){
      var $this = $(this);
      if($this.find(".fa-sort-desc").length === 0){
      window.updateTrendingHistory(page1,sort1,page2,"indirect",page3,page4);
      window.reloadTopCollaborators(page1,sort1,page2,"indirect",page3,page4);
        $this.parent().find(".fa-sort-desc").removeClass("fa-sort-desc").addClass("fa-sort");
        $this.find(".fa-sort").removeClass("fa-sort").addClass("fa-sort-desc");
      }
    });
    $("#top10maintainers .total").unbind().click(function(){
      var $this = $(this);
      if($this.find(".fa-sort-desc").length === 0){
      window.updateTrendingHistory(page1,sort1,page2,"total",page3,page4);
      window.reloadTopCollaborators(page1,sort1,page2,"total",page3,page4);
        $this.parent().find(".fa-sort-desc").removeClass("fa-sort-desc").addClass("fa-sort");
        $this.find(".fa-sort").removeClass("fa-sort").addClass("fa-sort-desc");
      }
    });
  };
})($jq);
