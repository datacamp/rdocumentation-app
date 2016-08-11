var currentPackage = 1;
var currentFunction = 1;

function reloadPackages(){
	$.ajax({
		url: "/api/searchpackages?"+window.location.href.slice(window.location.href.indexOf('?') + 1)+ "&page=" + currentPackage,
  		context: document.body
	}).done(function(result){
		$('.packagedata').empty();
		$('.packagepages').empty();
		for(var i = 0; i < result.packages.length; i++) {
        	var hit = result.packages[i];
          	var versionURI = '/packages/' + encodeURIComponent(hit.fields.package_name) + '/versions/' + encodeURIComponent(hit.fields.version);
          	var html ="";
            html += "<section class='search-result--item'>";
            html += "<h5 class=\"search-result--item-header\">";
            html += "Package ";
            html += "<a href=" + versionURI +'>'+hit.fields.package_name+'&nbsp;v'+hit.fields.version+'</a>';
            html += "</h5>";
            html += "<dl>";
            for(highlight in hit.highlight) {
              html += "<dt>"+highlight+"</dt>";
              html += "<dd>"+hit.highlight[highlight].toString()+"</dd>";
            }
          	html += "</dl>";
          	html += "</section>";
          	$('.packagedata').append(html);
      	}
      	if(currentPackage>1){
  			$('.packagepages')
  				.append("<a class=\'resultarrow left\'><i class=\"fa fa-chevron-left\"></i> Previous Results </a>");
  			$('.packagepages .left').click(function(){
  				currentPackage--;
  				reloadPackages();
  			});
	  	}
  		$('.packagepages')
  			.append("<a class='resultarrow pull-right right'>Next Results <i class=\"fa fa-chevron-right\"></i></a>");
  		$('.packagepages .right').click(function(){
			currentPackage++;
			reloadPackages();
		  });
      $("#packagetotal").html(result.hits+" results");
	});
};

function reloadFunctions(){
	$.ajax({
		url: "/api/searchfunctions?"+window.location.href.slice(window.location.href.indexOf('?') + 1)+ "&page=" + currentFunction,
  		context: document.body
	}).done(function(result){
		$('.functiondata').empty();
		$('.functionpages').empty();
		for(var i = 0; i < result.functions.length; i++) {
        	var hit = result.functions[i];
          	var versionURI = '/packages/' + encodeURIComponent(hit.fields.package_name) + '/versions/' + encodeURIComponent(hit.fields.version);
          	var html ="";
            html += "<section class='search-result--item'>";
            html += "<h5 class=\"search-result--item-header\">";
            html += "Function ";
            html += "<a href=" + versionURI + '/topics/' + encodeURIComponent(hit.fields.name) +'>'+hit.fields.name+'</a>';
            html += "<span><a href="+ versionURI +'> ['+ hit.fields.package_name +'&nbsp;v'+ hit.fields.version +']</a></span>';
            html += "</h5>";
            html += "<dl>";
            for(highlight in hit.highlight) {
              html += "<dt>"+highlight+"</dt>";
              html += "<dd>"+hit.highlight[highlight].toString()+"</dd>";
            }
          	html += "</dl>";
          	html += "</section>";
          	$('.functiondata').append(html);
      	}
      	if(currentFunction>1){
  			$('.functionpages')
  				.append("<a class=\'resultarrow left\'><i class=\"fa fa-chevron-left\"></i> Previous Results </a>");
  			$('.functionpages .left').click(function(){
  				currentFunction--;
  				reloadFunctions();
  			});
	  	}
  		$('.functionpages')
  			.append("<a class='resultarrow pull-right right'>Next Results <i class=\"fa fa-chevron-right\"></i></a>");
  		$('.functionpages .right').click(function(){
			currentFunction++;
			reloadFunctions();
		});
      $("#functiontotal").html(result.hits+" results");
	});
};

$(document).ready(function() {
	document.getElementById("searchbar").value = document.location.href.split("q=")[1].split("&")[0];
  reloadPackages();
	reloadFunctions();
	$("#searchtabs").tabs();
});