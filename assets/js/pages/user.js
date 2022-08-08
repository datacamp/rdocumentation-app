(function($){

  window.User = {
    bindButtons: function() {
      User.bindDeleteButton();
      User.bindEditButton();
    },

    bindEditButton: function() {
      $(".edit-example").click(function(){
        $(this).unbind("click");
        var $example = $(this).parents(".example");
        var $text = $example.find(".example--text");
        $text.replaceWith("<textarea name = 'text' rows = '4'>"+$text.data("raw")+"</textarea>");

        var $element = $example.find("textarea")[0];

        var simplemde = Examples.loadMDEWidget($element);

        $example.find(".example--body").append("<div><button class='btn btn-primary submit-edit' type='button'>Submit your changes</button></div>");
        $example.find(".submit-edit").click(function(){
          $this = $(this);
          var value = simplemde.value();
          $.post("/api/examples/"+$example.data("exampleid"),{text: value},function(response){
            var string = "<p class='example--text' data-raw='"+value+"'>"+value+"</p>";
            $example.find(".example--body").html(string);

            Examples.renderExamples('.example--text');
            User.bindEditButton();
          });
        });
      });
    },

    bindDeleteButton: function() {
      $(".delete-example").click(function(){
        var $this = $(this);
        var confimed = confirm("Are you sure you want to delete this example ?");
        if (!confimed) return;
        $.ajax({
          url: "api/examples/"+$(this).parents(".example").data("exampleid"),
          type: "delete",
          success: function(response){
            if(response.status === "done"){
              $this.parents(".example-wrapper").remove();
            }
          }
        });
      });
    }
  };

	bootUser = function(){
		User.bindButtons();
	};

})($jq);
