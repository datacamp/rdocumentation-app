$(document).ready(function(){
	var depsyurl = $(".depsy").data("url");
  if(depsyurl) {
  	$.get(depsyurl,function(data){
      if(data.impact) {
        $("#impactnr").html(Math.round(data.impact*100)+"th");
        $(".depsy").show();
      } else {
        $(".depsy").css('visibility', 'hidden');
      }

  		if(data.top_collabs) {
    		$(".top-collab-list").append("<h4>Top collaborators</h4>");
  			data.top_collabs.forEach(function(collab){
  				$(".top-collab-list").append("<a href = '/collaborators/name/"+encodeURIComponent(collab.name)+"'>"+collab.name+"</a>");
        });
  		}

      if(data.icon) {
        $('#collaborator-gravatar').attr('src', data.icon);
      }

      if(data.github_login) {
        $('#collaborator_github_link').attr('href', "https://github.com/"+ data.github_login);
      }

  	});
  }

	var downurl = $(".direct-downloads").data("url");
  if(downurl) {
  	$.get(downurl,function(data){
  		if(data.total){
  			$("#direct-downloadsnr").html(data.total);
  			$(".direct-downloads").show();
  		}
  	});
  }

  $('span.collaborator-type i.fa.fa-user').tooltip();
  $('span.collaborator-type i.fa.fa-users').tooltip();
  $('.impact-info').tooltip();
});
