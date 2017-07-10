(function($) {
    window.bootSource = function() {
        if(window.location.pathname.match(/source\/{0,1}$/gi) !== null) {
            $.ajax({
                url: "api/packages/" + $('#tree').data("package-name") + "/versions/" + $('#tree').data('package-version') + "/sourceTree",
                crossDomain:true,
                xhrFields: {
                withCredentials: true
                }
            }).done(function(result){
                $('#tree').treeview(
                    {
                        data: result.tree,
                        levels: 1,
                        emptyIcon: "glyphicon glyphicon-file",
                        expandIcon: "glyphicon glyphicon-folder-close",
                        collapseIcon: "glyphicon glyphicon-folder-open",
                        onNodeSelected: function(event, data) {
                            loadSource(data.href);
                        }
                    });
                $('#tree').fadeIn();        
            });
        };
    };

    var loadSource = function(href){
        $('#source-container').hide();
        $.ajax({
            url: "api/packages/" + $('#tree').data("package-name") + "/versions/"+ $('#tree').data('package-version') + "/source/" + href,
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