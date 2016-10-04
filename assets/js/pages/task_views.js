(function($) {
  window.bootTaskViews = function() {
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
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    $('.list-group').css('height',h-80);
    $(".footer--credits--title").css("left", "50%");
  };

  window.makeSideBar = function(){
    $(".sidebar-slider-icon").click(function(){
      var slider = $(".sidebar-slider-icon i");
      if(slider.hasClass("fa-angle-right")){
        slideRight(slider);
      }else{
        slideLeft(slider);
      }
    });
  };

  var slideLeft = function(slider){
    slider.removeClass("fa-angle-left");
    slider.addClass("fa-angle-right");
    $(".sliding-sidebar").animate({width:0},350,function(){
      $(".view").css("width","calc(100% - 2em)");
      $(".view").css("margin-left","20px");
      $(".footer").css("width","calc(100% - 2em)");
      $(".footer").css("margin-left","0px");
      // $(".sidebar-slider-icon").css("left","10px");
    });
  }

  var slideRight = function(slider){
    slider.removeClass("fa-angle-right");
    slider.addClass("fa-angle-left");
    $(".view").css("width","calc(100% - 21em)");
    $(".view").css("margin-left","280px");
    $(".footer").css("width","calc(100% - 21em)");
    $(".footer").css("margin-left","280px");
    // $(".sidebar-slider-icon").css("left","250px");
    $(".sliding-sidebar").animate({width:250},350);
  }

  var hideSlider = function(){
    if($(".view").width()<600){
      var slider = $(".sidebar-slider-icon i");
      slideLeft(slider);
    }
  }
  window.getView = function(view){
    if(!(urlParam('viewer_pane')==='1')) location.hash = view;
    $.ajax({
    	url: "/taskviews/"+view,
      cache: false
    }).done(function(response){
    	$(".view").html(response);
    	window.bindFilter();
      percentileTaskView();
      $(document).trigger('content-changed');
    });
  };

  window.sortTable = function(){
    $("table.taskviewtable").tablesorter({
          textExtraction: function (node){
            if($(node).find(".rating").length>0){
              return ($(node).find(".rating").data('rating'));
            }else if($(node).find(".percentile-task").length>0){
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
