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
            $('#tree').fadeIn();        
      });
    };

    var loadSource = function(href){
        $('#source-container').hide();
        $.ajax({
            url: "api/packages/glue/versions/1.1.1/source/" + href,
            crossDomain:true,
            xhrFields: {
            withCredentials: true
            }
        }).done(function(result){
            if(result.source !== undefined){
                $('#code').html(result.source);
                $('#source-container').fadeIn();
            }
        });
    }

    
    
})($jq);