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
			var bootstrapExamples = function() {
		    if(urlParam("viewer_pane") != 1) {
		      window.initAddedDCLightExercises();
		    }
		    else {
		      $('.run-example').each(function() {
		        var packageName = $(this).parent().data('package-name') || $('.packageData').data('package-name');
		        $(this).click(function(){
		          window.executePackageCode(packageName,$(this).prev().text());
		        });
		      });
		    }
		  };

		  var renderer = new marked.Renderer();
		  var defaultCodeFunction = renderer.code;

		  renderer.code = function(code, lang) {
		    if(urlParam("viewer_pane") == 1 && (lang === 'r' || lang === '{r}')) {
		      var $block = $("<div>");

		      var exampleHTML = "<pre><code>" + code + "</code></pre>";

		      var $button = $('<button type="button" class="visible-installed btn btn-primary js-external run-example">Run codeblock </button>');

		      $block.append(exampleHTML);
		      $block.append($button);
		      return $block.prop('outerHTML');

		    }
		    else if(lang === '{r}' || lang === 'r' || lang === 'python' || lang === '{python}') {
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
	    var element = $example.find("textarea")[0]
			var simplemde = new SimpleMDE({
        element: element,
        previewRender: function(plainText, preview) {
          setTimeout(function() {
            var rendered = marked(plainText, {renderer: renderer});
            $(preview).html(rendered);
            if(urlParam("viewer_pane") !== 1){
              bootstrapExamples();
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
    			bootstrapExamples();
      		bindEditButton();
      	});
      });
		});
	};

})($jq);