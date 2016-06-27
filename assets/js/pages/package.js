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
      var chart = nv.models.multiBarChart()
        .reduceXTicks(true)   //If 'false', every single x-axis tick label will be rendered.
        .rotateLabels(0)      //Angle to rotate x-axis labels.
        .showControls(true)   //Allow user to switch between 'Grouped' and 'Stacked' mode.
        .groupSpacing(0.1)    //Distance between each group of bars.
        .x(function (d){
          console.log(d);
          return d.timestamp;
        })
        .y(function (d){
          console.log(d);
          return d.count;
        })
      ;

      chart.xAxis
          .tickFormat(function(d) { return d3.time.format('%x')(new Date(d)); });

      chart.yAxis
          .tickFormat(d3.format(',.1f'));

      getData($('#chart').data('url'), function(data) {
        var serie = {
          key: "Last month downloads",
          values: data
        };
        $('#chart').show();
        d3.select('#chart svg')
          .datum([serie])
          .call(chart);
      });


      nv.utils.windowResize(chart.update);

      return chart;
  });

};

$(document).ready(function() {
  window.packageVersionToggleHandler();
  window.graphDownloadStatistics();
});
