(function($) {
    window.bootSource = function() {
        $.ajax({
        url: "api/packages/glue/versions/1.1.1/source",
        crossDomain:true,
        xhrFields: {
          withCredentials: true
        }
      }).done(function(result){
        $('#tree').treeview({data: result.tree});
      });
    };
})($jq);