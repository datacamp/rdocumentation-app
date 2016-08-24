(function($) {
  window.packageVersionToggleHandler = function() {
    $('#packageVersionSelect').change(function(){
      var url = $(this).find('option:selected').data('uri');
      if(urlParam('viewer_pane') === '1'){
        window.replacePage(url,true);
      } else {
        window.location.href = url;
      }
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

  window.dependencyGraphPackage = function(){
    var getData = function(data_url, callback) {
      return $.get(data_url, callback);
    };

    nv.addGraph({
      generate: function() {
        var width = $('#packagedependencygraph').innerWidth(),
          height = $('#packagedependencygraph').innerHeight();
        var d3Colors = d3.scale.category20();
        var chart = nv.models.forceDirectedGraph()
          .width(width)
          .height(height)
          .color(function(d) { return d3Colors(d.group); })
          .nodeExtras(function(node) {
            node
              .append("text")
              .attr("dx", 12)
              .attr("dy", ".35em")
              .text(function(d) { return d.name; });
          });
        getData($('#packagedependencygraph').data('url'), function(data) {
          $('#packagedependencygraph').show();
          d3.select('#packagedependencygraph svg')
            .datum(data)
            .call(chart);
        });

        return chart;
      },
          callback: function(graph) {
              window.onresize = function() {
                 var width = $('#packagedependencygraph').innerWidth(),
                  height = $('#packagedependencygraph').innerHeight();
                  graph.width(width).height(height);
                  d3.select('#packagedependencygraph svg')
                      .attr('width', width)
                      .attr('height', height)
                      .call(graph);
              };
          }
      });
  };

  window.reverseDependencyGraph = function(){
    var getData = function(data_url, callback) {
      return $.get(data_url, callback);
    };

    nv.addGraph({
      generate: function() {
        var width = $('#packagereversedependencygraph').innerWidth(),
          height = $('#packagereversedependencygraph').innerHeight();
        var d3Colors = d3.scale.category20();
        var chart = nv.models.forceDirectedGraph()
          .width(width)
          .height(height)
          .color(function(d) { return d3Colors(d.group) })
          .nodeExtras(function(node) {
            node.append("text")
              .attr("dx", 12)
              .attr("dy", ".35em")
              .text(function(d) { return d.name });
          });
        getData($('#packagereversedependencygraph').data('url'), function(data) {
          $('#packagereversedependencygraph').show();
          d3.select('#packagereversedependencygraph svg')
            .datum(data)
            .call(chart);
        });

        return chart;
      },
      callback: function(graph) {
        window.onresize = function() {
          var width = $('#packagereversedependencygraph').innerWidth(),
            height = $('#packagereversedependencygraph').innerHeight();
          graph.width(width).height(height);
          d3.select('#packagereversedependencygraph svg')
            .attr('width', width)
            .attr('height', height)
            .call(graph);
        };
      }

    });

  };

  window.redrawChart = function(days){
    var getData = function(data_url, callback) {
      return $.get(data_url, callback);
    };
    var url = $('#chart').data('url');
    url = url.substring(0,url.indexOf('/per_day_last_month'));
    url = url+'/days/'+days+'/per_day'
    if(days<31){
      getData(url, function(data) {
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
        chartData = d3.select('#chart svg').datum(data);
        chartData.datum([direct_serie,indirect_serie]).transition().duration(500).call(window.chart);
      });
    }
    else{
      getData(url, function(data) {
        var total_serie = {
          key: "Total downloads",
          values: data.filter(function(e){
            return e.key=="total_downloads";
          })
        };
        chartData = d3.select('#chart svg').datum(data);
        chartData.datum([total_serie]).transition().duration(500).call(window.chart);
      });
    }
      nv.utils.windowResize(window.chart.update);
  };

  window.redrawBiocChart = function(years){
    var getData = function(data_url, callback) {
      return $.get(data_url, callback);
    };
    var url = $('#bioc_chart').data('url');
    url = url.substring(0,url.indexOf('/per_month_last_years')-1);
    url = url+years+'/per_month_last_years'
    getData(url, function(data) {
      var serie = {
        key: "Downloads",
        values: data
      };
      chartData = d3.select('#bioc_chart svg').datum(data);
      chartData.datum([serie]).transition().duration(500).call(window.chart);
    });
    nv.utils.windowResize(window.chart.update);
  };


  window.makeSlider = function(){
    $(".slider-icon").click(function(){
      var slider = $(".slider-icon");
      if(slider.hasClass("fa-angle-down")){
        slider.removeClass("fa-angle-down");
        slider.addClass("fa-angle-up");
        $(".sliding").slideDown();
        $( '#tab0' ).click();
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

  window.bindTabs = function() {
    $("#tab1").click(function(){
      if(!$("#packagedependencygraph svg").hasClass("nvd3-svg")){
        window.dependencyGraphPackage();
      }
    });
    $("#tab2").click(function(){
      if(!$("#packagereversedependencygraph svg").hasClass("nvd3-svg")){
        window.reverseDependencyGraph();
      }
    });
  };

  window.bindUpvoteButton = function() {
    $('#upvotePackage').click(function(e) {
      e.preventDefault();
      var $this = $(this);
      var actionUrl = $(this).data('action');
      $.post(actionUrl, function(response) {
        $('.star-count').html(response.newCount);
        $this.attr('upvoted', response.star !== 'deleted');
      });
    });
  };

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
