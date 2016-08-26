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
			var $text = $(this).parents(".example").find(".example--text");
			$text.replaceWith("<textarea name = 'text' rows = '4'>"+$text.data("raw")+"</textarea>");
			var bootstrapDCL = function() {
	    	var exercises = document.querySelectorAll("[data-datacamp-exercise]");
		    //TODO add code to reinit exercices
		  };
			var renderer = new marked.Renderer();
	    var defaultCodeFunction = renderer.code;
	    renderer.code = function(code, lang) {
	      if(lang === '{r}' || lang === 'r' || lang === 'python' || lang === '{python}') {
	        var codeBlock = '<div data-datacamp-exercise data-lang="r">';
	        codeBlock += '<code data-type="sample-code">';
	        codeBlock += code;
	        codeBlock += '</code>';
	        codeBlock += '</div>';
	        return codeBlock;
	      } else {
	        return defaultCodeFunction.call(this, code, lang);
	      }
	    };
	    var element = $(this).parents(".example").find("textarea")[0]
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
      $(this).parents(".example").find(".example--body").append("<div><button class='btn btn-primary submit-edit' type='button'>Submit your changes</button></div>");
      $(this).parents(".example").find(".submit-edit").click(function(){
      	$this = $(this);
      	var value = simplemde.value();
      	console.log($this.parents(".example").data("exampleid"));
      	$.post("/api/"+$this.parents(".example").data("exampleid")+"/update",{text: value},function(response){
					var string = "<p class='example--text' data-raw='"+value+"'>"+value+"</p>";
      		$this.parents(".example").find(".example--body").html(string);
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