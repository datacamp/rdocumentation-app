$(document).ready(function(){
	var url = $(".depsy").data("url");
	$.get(url,function(data){
		$("#impactnr").html(Math.round(data.impact*100)+"th");
		$(".depsy").show();
	});
});