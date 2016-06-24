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
  var client = new $.es.Client({
    hosts: 'http://ec2-54-67-61-189.us-west-1.compute.amazonaws.com:9200'
  });

  nv.addGraph(function() {
      var chart = nv.models.multiBarChart()
        .reduceXTicks(true)   //If 'false', every single x-axis tick label will be rendered.
        .rotateLabels(0)      //Angle to rotate x-axis labels.
        .showControls(true)   //Allow user to switch between 'Grouped' and 'Stacked' mode.
        .groupSpacing(0.1)    //Distance between each group of bars.
        .x(function (d){
          console.log(d);
          return d.x;
        })
        .y(function (d){
          console.log(d);
          return d.y;
        })
      ;

      chart.xAxis
          .tickFormat(d3.format(',f'));

      chart.yAxis
          .tickFormat(d3.format(',.1f'));

      d3.select('#chart svg')
          .datum([])
          .call(chart);

      nv.utils.windowResize(chart.update);

      return chart;
  });

  client.search({

  });


};

$(document).ready(function() {
  window.packageVersionToggleHandler();
  window.graphDownloadStatistics();
});
