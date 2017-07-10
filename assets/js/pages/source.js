(function($) {
    window.bootSource = function() {
        $.ajax({
        url: "api/packages/glue/versions/1.1.1/sourceTree",
        crossDomain:true,
        xhrFields: {
          withCredentials: true
        }
      }).done(function(result){
        $('#tree').treeview(
            {
                data: result.tree,
                levels: 1,
                onNodeSelected: function(event, data) {
                    loadSource(data.href);
                }
            });
        
      });
    };

    var loadSource = function(href){
        $.ajax({
            url: "api/packages/glue/versions/1.1.1/source/" + href,
            crossDomain:true,
            xhrFields: {
            withCredentials: true
            }
        }).done(function(result){
            $('#code').html(result.source);
        });
    }

    
    
})($jq);