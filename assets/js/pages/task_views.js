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
        hideSlider();
      });
    });
    if($(".view")[0]){
      if(window.location.hash) {
        getView(window.location.hash.slice(1));
      } else {
        var v = $('.list-group .list-group-item:first-child').text();
        getView(v);
      } 
    }
    window.makeSideBar();
    hideSlider();
  };

  window.makeSideBar = function(){
    $(".sidebar-slider-icon").click(function(){
      var slider = $(".sidebar-slider-icon");
      if(slider.hasClass("fa-angle-right")){
        slideRight(slider);
      }else{
        slideLeft(slider);
      }
    });
  };

  slideLeft = function(slider){
    slider.removeClass("fa-angle-left");
    slider.addClass("fa-angle-right");
    $(".sliding-sidebar").animate({width:'toggle'},350,function(){
      $(".view").css("width","100%");
      $(".view").css("margin-left","20px");
      $(".footer--credits--title ").css("width","100%");
    $(".footer--credits--title ").css("margin-left","0px");
    });
  }

  slideRight = function(slider){
    slider.removeClass("fa-angle-right");
    slider.addClass("fa-angle-left")
    $(".view").css("width","calc(100% - 21em)");
    $(".view").css("margin-left","280px");
    $(".footer--credits--title ").css("width","calc(100% - 21em)");
    $(".footer--credits--title ").css("margin-left","280px");
    $(".sliding-sidebar").animate({width:'toggle'},350);
  }

  hideSlider = function(){
    if($(".view").width()<600){
      var slider = $(".sidebar-slider-icon");
      slideLeft(slider);
    }
  }




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

