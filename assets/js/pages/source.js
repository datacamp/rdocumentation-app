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
                if(result.tree.length > 0){
                    // Select the first file in 'root'
                    for(var node of result.tree){
                        if(node.nodes === undefined){
                            node.state.selected = true;
                            loadSource(node.href);
                            break;
                        }
                    }
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
                }
                else{                    
                    $('#source-not-found').fadeIn();
                }
                  
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

                // Highlight code
                $('pre code').each(function(i, block) {
                    hljs.highlightBlock(block);
                    hljs.lineNumbersBlock(block);
                });
            }
        });
    }

    
    
})($jq);