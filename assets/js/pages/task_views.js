$(document).ready(function() {
  $( ".js-display-list" ).click(function(e) {
    e.preventDefault();
    $(this).parent().find(".js-view-package-list").toggle();
  });
  $(".list-group-item").each(function(){
  	$(this).click(function(event){
  		event.preventDefault();
  		getView($(this).html());
  		$(".highlight").removeClass("highlight");
  		$(this).addClass("highlight");
  	});
  });
});

getView = function(view){
  $.ajax({
  	url: "/taskviews/"+view
  }).done(function(response){
  	$(".view").html($($.parseHTML(response)).filter(".content").html());
  	resetFilter();
  });
}