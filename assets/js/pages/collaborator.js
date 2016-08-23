$(document).ready(function(){
	var depsyurl = $(".depsy").data("url");
	$.get(depsyurl,function(data){
		$("#impactnr").html(Math.round(data.impact*100)+"th");
		$(".depsy").show();
		if(data["top_collabs"]){
		$(".top-collab-list").append("<h4>Top collaborators</h4>");
			data["top_collabs"].forEach(function(collab){
				$(".top-collab-list").append("<a href = '/collaborators/name/"+encodeURIComponent(collab.name)+"'>"+collab.name+"</a>");
			});
		}
	});
	var downurl = $(".direct-downloads").data("url");
	$.get(downurl,function(data){
		if(data.total){
			$("#direct-downloadsnr").html(data.total);
			$(".direct-downloads").show();
		}
	});
});