(function($){
	bootUser = function(){
		window.userButtons();
	};

	window.userButtons = function(){
		$(".delete-example").click(function(){
			var $this = $(this);
			$.post("api/"+$(this).parents(".example").data("exampleid")+"/remove",function(response){
				if(response.status === "done"){
					console.log("succes"); 
					$this.parents(".example-wrapper").remove();
				}
			});
		});
		bindEditButton();
	};

	bindEditButton = function(){
		$(".edit-example").click(function(){
			$(this).unbind("click");
			var $example = $(this).parents(".example");
			var $text = $example.find(".example--text");
			$text.replaceWith("<textarea name = 'text' rows = '4'>"+$text.data("raw")+"</textarea>");
	    var element = $example.find("textarea")[0]
			var simplemde = new SimpleMDE({
        element: element,
        previewRender: function(plainText, preview) {
          setTimeout(function() {
            var rendered = marked(plainText, {renderer: renderer});
            $(preview).html(rendered);
            if(urlParam("viewer_pane") !== 1){
              bootstrapDCL();
            }
          }, 0);
          return "Loading...";
        },
        spellChecker: false,
        status: false
      });
      $example.find(".example--body").append("<div><button class='btn btn-primary submit-edit' type='button'>Submit your changes</button></div>");
      $example.find(".submit-edit").click(function(){
      	$this = $(this);
      	var value = simplemde.value();
      	$.post("/api/"+$example.data("exampleid")+"/update",{text: value},function(response){
					var string = "<p class='example--text' data-raw='"+value+"'>"+value+"</p>";
      		$example.find(".example--body").html(string);
      		$('.example--text').each(function() {
      			var markdown = $(this).html();
      			var rendered =  marked(markdown, {renderer: renderer});
      			$(this).html(rendered);
    			});
      		bindEditButton();
      	});
      });
		});
	};

})($jq);