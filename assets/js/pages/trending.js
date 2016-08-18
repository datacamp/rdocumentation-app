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

      getData($('#trendingdownloads').data('url'), function(data) {
        $('#trendingdownloads').show();
        d3.select('#trendingdownloads svg')
          .datum(data)
          .call(chart);
      });

		chart.multibar.dispatch.on("elementClick", function(e) {
		    var url = "/packages/"+e.data.key;
		    document.location = url;
		});


      	nv.utils.windowResize(chart.update);

      	return chart;
});
}
trendingKeywords = function(){
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

      getData($('#topkeywords').data('url'), function(data) {
        $('#topkeywords').show();
        d3.select('#topkeywords svg')
          .datum([{
          	key: "Top keywords",
          	values: data
          }])
          .call(chart);
      });

      chart.discretebar.dispatch.on("elementClick", function(e) {
		    var url = "/search?q="+e.data.key;
		    document.location = url;
		});

      nv.utils.windowResize(chart.update);

      return chart;
});
}
dependencyGraph = function(){
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
             getData($('#dependencygraph').data('url'), function(data) {
        $('#dependencygraph').show();
        d3.select('#dependencygraph svg')
              .datum(data)
              .call(chart);
      });

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
}

top10Downloads = function(){
  var $this = $("#top10downloads");
  if ($this.length > 0) {
    $.get($this.data('url'),function(data){
      data.results.forEach(function(piece,i){
        var j = i+1;
        $this.find(".data").append("<tr><td>"+j+". <a href='/packages/"+piece.package_name+"'>"+piece.package_name+"</a></tr></td>");
      });
      $this.show();
    });
  }
};

top10Maintainers = function(){
  var $this = $("#top10maintainers");
  if ($this.length > 0) {
    $.get($this.data('url'),function(data){
      data.results.forEach(function(piece,i){
        var j = i+1;
        $this.find(".data").append("<tr><td>"+j+". <a href='/collaborators/name/"+piece.name+"'>"+piece.name+"</a></tr></td>");
      });
      $this.show();
    });
  }
};

top10new = function(){
  var $this = $("#top10new");
  if ($this.length > 0) {
    $.get($this.data('url'),function(data){
      data.newArrivals.forEach(function(piece){
        var release = new Date(piece.rel);
        $this.find(".data").append("<tr><td><a href='/packages/"+piece.package_name+"'>"+piece.package_name+"</a><p class='info'>"+release.toDateString()+"</p></tr></td>");
      });
      $this.show();
    });
  }
};

top10renewed = function(){
  var $this = $("#top10renew");
  if ($this.length > 0) {
    $.get($this.data('url'),function(data){
      data.newVersions.forEach(function(piece){
        var release = new Date(piece.rel);
        $this.find(".data").append("<tr><td><a href='/packages/"+piece.package_name+"'>"+piece.package_name+"</a><p class='info'>"+release.toDateString()+"</p></tr></td>");
      });
      $this.show();
    });
  }
};



$(document).ready(function(){
	top10Downloads();
  top10renewed();
  top10new();
  top10Maintainers();
});
