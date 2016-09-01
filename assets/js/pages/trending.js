(function($) {
  window.trendingPackagesLastWeek = function(){
  	var getData = function(data_url, callback) {
      return $.get(data_url, callback);
    };

    nv.addGraph(function() {
    	var chart = nv.models.multiBarChart()
          .reduceXTicks(true)   //If 'false', every single x-axis tick label will be rendered.
          .rotateLabels(0)      //Angle to rotate x-axis labels.
          .groupSpacing(0.1)    //Distance between each group of bars.
          .stacked(true)
          .showControls(false)
          .x(function (d){
            return d.timestamp;
          })
          .y(function (d){
            return d.count;
          });

        chart.xAxis
            .tickFormat(function(d) { return d3.time.format('%x')(new Date(d)); });

        chart.yAxis
            .tickFormat(d3.format(',.1f'));
        if($('#trendingdownloads').data('url')){
          getData($('#trendingdownloads').data('url'), function(data) {
            $('#trendingdownloads').show();
            d3.select('#trendingdownloads svg')
              .datum(data)
              .call(chart);
          });
        }
  		chart.multibar.dispatch.on("elementClick", function(e) {
  		    var url = "/packages/"+e.data.key;
  		    document.location = url;
  		});


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
    trendingPackagesLastWeek();
    trendingKeywords();
    if(typeof(Set) !== "undefined"){
      dependencyGraph();
    }
    $(".trends .fa-info-circle").tooltip({placement:"bottom"});
    if(getCurrentPath().indexOf('trends')==0) {
      var page1 = parseInt(urlParam("page1")) || 1;
      var page2 = parseInt(urlParam("page2")) || 1;
      var page3 = parseInt(urlParam("page3")) || 1;
      var page4 = parseInt(urlParam("page4")) || 1;
      window.rebindTrending(page1,page2,page3,page4);
    }
  };

  window.reloadMostPopular = function(page1,page2,page3,page4){
    $.ajax({
      url : "/api/trends/mostpopular?page=" + page1
    }).done(function(result){
      $("#top10downloads tbody").empty();
      result.results.forEach(function(result,i){
        $("#top10downloads tbody").append("<tr><td>"+((page1-1)*10+i+1)+". "+"<a href = '/packages/"+result.package_name+"'>"+result.package_name+"</a><p class = 'info-trends'>"+result.total+"</p></td></tr>");
      });
    });
    window.rebindTrending(page1,page2,page3,page4);
  };

  window.reloadTopCollaborators = function(page1,page2,page3,page4){
    $.ajax({
      url : "/api/trends/topcollaborators?page=" + page2
    }).done(function(result){
      $("#top10maintainers tbody").empty();
      result.results.forEach(function(result,i){
        $("#top10maintainers tbody").append("<tr><td>"+((page2-1)*10+i+1)+". "+"<a href = '/collaborators/"+encodeURIComponent(result.name)+"'>"+result.name+"</a><p class = 'info-trends'>"+result.total+"</p></td></tr>");
      });
    });
    window.rebindTrending(page1,page2,page3,page4);
  };

  window.reloadNewPackages = function(page1,page2,page3,page4){
    $.ajax({
      url : "/api/trends/newpackages?page=" + page3
    }).done(function(result){
      $("#top10new tbody").empty();
      result.newArrivals.forEach(function(arrival){
        var release = new Date(arrival.rel);
        $("#top10new tbody").append("<tr><td><a href = '/packages/"+arrival.package_name+"'>"+arrival.package_name+"</a><p class = 'info-trends'>"+release.toDateString()+"</p></td></tr>");
      });
    });
    window.rebindTrending(page1,page2,page3,page4);
  };

  window.reloadNewVersions = function(page1,page2,page3,page4){
    $.ajax({
      url : "/api/trends/newversions?page=" + page4
    }).done(function(result){
      $("#top10renew tbody").empty();
      result.newVersions.forEach(function(arrival){
        var release = new Date(arrival.rel);
        $("#top10renew tbody").append("<tr><td><a href = '/packages/"+arrival.package_name+"'>"+arrival.package_name+"</a><p class = 'info-trends'>"+release.toDateString()+"</p></td></tr>");
      });
    });
    window.rebindTrending(page1,page2,page3,page4);
  };

  window.updateTrendingHistory = function(page1,page2,page3,page4){
    var url = window.location.protocol+ "//" +
     window.location.host +
     window.location.pathname +
     '?page1=' + page1 +
     '&page2=' + page2 +
     '&page3=' + page3 +
     '&page4=' + page4;
     history.pushState({page1: page1, page2: page2, page3: page3, page4: page4}, "Trends", url);
  };

  window.onpopstate = function(event) {
    if($(".trends")[0]){
      reloadMostPopular(event.state.page1, event.state.page2, event.state.page3, event.state.page4);
      reloadTopCollaborators(event.state.page1, event.state.page2, event.state.page3, event.state.page4);
      reloadNewPackages(event.state.page1, event.state.page2, event.state.page3, event.state.page4);
      reloadNewVersions(event.state.page1, event.state.page2, event.state.page3, event.state.page4);
    }
  };

  window.rebindTrending = function(page1,page2,page3,page4) {
    if(page1 <= 1){
      $("#top10downloads .previous").hide();
    }else{
      $("#top10downloads .previous").show();
    }
    $("#top10downloads .previous").unbind().click(function(){
      window.updateTrendingHistory(page1-1,page2,page3,page4);
      window.reloadMostPopular(page1-1,page2,page3,page4);
    });
    $("#top10downloads .next").unbind().click(function(){
      window.updateTrendingHistory(page1+1,page2,page3,page4);
      window.reloadMostPopular(page1+1,page2,page3,page4);
    });
    if(page2 <= 1){
      $("#top10maintainers .previous").hide();
    }else{
      $("#top10maintainers .previous").show();
    }
    $("#top10maintainers .previous").unbind().click(function(){
      window.updateTrendingHistory(page1,page2-1,page3,page4);
      window.reloadTopCollaborators(page1,page2-1,page3,page4);
    });
    $("#top10maintainers .next").unbind().click(function(){
      window.updateTrendingHistory(page1,page2+1,page3,page4);
      window.reloadTopCollaborators(page1,page2+1,page3,page4);
    });
    if(page3 <= 1){
      $("#top10new .previous").hide();
    }else{
      $("#top10new .previous").show();
    }
    $("#top10new .previous").unbind().click(function(){
      window.updateTrendingHistory(page1,page2,page3-1,page4);
      window.reloadNewPackages(page1,page2,page3-1,page4);
    });
    $("#top10new .next").unbind().click(function(){
      window.updateTrendingHistory(page1,page2,page3+1,page4);
      window.reloadNewPackages(page1,page2,page3+1,page4);
    });
    if(page4 <= 1){
      $("#top10renew .previous").hide();
    }else{
      $("#top10renew .previous").show();
    }
    $("#top10renew .previous").unbind().click(function(){
      window.updateTrendingHistory(page1,page2,page3,page4-1);
      window.reloadNewVersions(page1,page2,page3,page4-1);
    });
    $("#top10renew .next").unbind().click(function(){
      window.updateTrendingHistory(page1,page2,page3,page4+1);
      window.reloadNewVersions(page1,page2,page3,page4+1);
    });
  };
})($jq);
