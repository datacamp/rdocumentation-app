(function($) {
  bootTaskViews = function() {
    $( ".js-display-list" ).click(function(e) {
      e.preventDefault();
      $(this).parent().find(".js-view-package-list").toggle();
    });

     $(".list-group-item").each(function(){
      $(this).click(function(event){
        event.preventDefault();
        getView($(this).html());
        $(".highlight").removeClass("highlight");
        $(this).addClass("highlight");
      });
    });

    if(window.location.hash) {
      getView(window.location.hash.slice(1));
    } else {
      var v = $('.list-group .list-group-item:first-child').text();
      getView(v);
    }

  };



  window.getView = function(view){
    location.hash = view;
    $.ajax({
    	url: "/taskviews/"+view,
      cache: false
    }).done(function(response){
    	$(".view").html(response);
    	window.bindFilter();
      percentileTaskView();
    });
  };

  window.sortTable = function(){
    $("table.taskviewtable").tablesorter({
            headers: {
              3: {
                  sorter:'rating'
              }
          },
          textExtraction: function (node){
            if($(node).find(".rating").length>0){
              return ($(node).find(".rating").data('rating'));
            }else if($(node).find(".percentile-task".length>0)){
              return $(node).find(".percentile-task").data('percentile');
            }
            return $(node).text();
          },
          sortList: [[2,1]]
      });
  };


  window.percentileTaskView = function(){
    requests =[];
    $('.taskviewtable .percentile-task').each(function(elem) {
      var $self = $(this);
      var url = $self.data('url');
      requests.push($.get(url, function(data){
        if(data.percentile !== null){
          $self.find(".percentile").text(''+ data.percentile + 'th');
          $self.data("percentile", data.percentile);
          $self.css({'visibility': 'visible'});
        } else{
          $self.css({'visibility': 'hidden'});
        }
      }));
    });

    $.when.apply(undefined,requests).then(function(){
      window.triggerIcon();
      sortTable();
    });
  };

})($jq);

