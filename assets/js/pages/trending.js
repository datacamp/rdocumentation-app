trendingPackagesLastWeek = function(){
	var getData = function(data_url, callback) {
    return $.get(data_url, callback);
  };

  nv.addGraph(function() {
  	var chart = nv.models.multiBarChart()
        .reduceXTicks(true)   //If 'false', every single x-axis tick label will be rendered.
        .rotateLabels(0)      //Angle to rotate x-axis labels.
        .showControls(true)   //Allow user to switch between 'Grouped' and 'Stacked' mode.
        .groupSpacing(0.1)    //Distance between each group of bars.
        .stacked(true)
        .showControls(false)
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

      getData($('#trendingdownloads').data('url'), function(data) {
      	var dict = {};
      	var days = [];
        data.forEach(function(day,i){
        	var buckets = day.day.buckets;
        	var time = day.key;
        	days.push(time);
        	buckets.forEach(function(bucket){
        		var key = bucket.key;
        		console.log(key);
        		var array = dict[key.toString()]||[];
        		console.log(array);
        		array.push({
        			count : bucket.doc_count,
        			key   : bucket.key,
        			timestamp : time
        		});
        		dict[key.toString()] = array;
        	})
        });
        console.log(days.length);
        for(var key in dict){
        	if(dict[key.toString()].length!=days.length){
        		days.forEach(function(day){
        			var found = false;
        			var i = 0;
        			while(!found&&i<dict[key.toString()].length){
        				if(dict[key.toString()][i].timestamp==day){
        					found = true;
        				}
        				i++;
        			}
        			if(!found){
        				dict[key.toString()].push({
        					count : 0,
        					key   : key.toString(),
        					timestamp : day
        				});
        			}

        		});
        	}
        }
        var series =[];
        console.log(dict);
        for(var key in dict){
        	console.log(key);
        	series.push({
        		key: key,
        		values: dict[key.toString()]
        	})
        }
        console.log(series);
        $('#trendingdownloads').show();
        d3.select('#trendingdownloads svg')
          .datum(series)
          .call(chart);
      });


      nv.utils.windowResize(chart.update);

      return chart;
});
}


$(document).ready(function(){
	trendingPackagesLastWeek();
});