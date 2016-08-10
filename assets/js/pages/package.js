window.packageVersionToggleHandler = function() {
  $('#packageVersionSelect').change(function(){
    var url = $(this).find('option:selected').data('uri');
    if(urlParam('viewer_pane') === '1'){
      window.replacePage(url);
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



      return window.chart;
  });

};

window.dependencyGraph = function(){
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
  if(days<30){
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


window.makeSlider = function(){
  $(".slider").click(function(){
    var slider = $(".slider");
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
  })
}



$(document).ready(function() {
  $.getScript("http://code.jquery.com/ui/1.12.0/jquery-ui.js", function(){
    window.triggerIcon();
    $("#show").click(function(){
      $("#show").hide();
      $("#details").find(".hidden").removeClass("hidden");
    });
    window.packageVersionToggleHandler();
    if(urlParam('viewer_pane') === '1'){
      $('#tabs').tabs({
        'beforeLoad':function(event,ui){
          window.setTab(event,ui);
        }
      });
    }
    else{
      $('#tabs').tabs({
      active: 0
      });
    }
    $("#tab1").click(function(){
      if(!$("#packagedependencygraph svg").hasClass("nvd3-svg")){
      window.dependencyGraph();
      }
    });
    $("#tab2").click(function(){
      if(!$("#packagereversedependencygraph svg").hasClass("nvd3-svg")){
      window.reverseDependencyGraph();
      }
    });
  });
  $.getScript("http://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js",function(){
    $.getScript("http://cdnjs.cloudflare.com/ajax/libs/nvd3/1.8.3/nv.d3.min.js",function(){
      window.makeSlider();
    })
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
      return $(node).text();
    });
  });
});
