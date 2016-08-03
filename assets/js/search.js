// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
// Source: https://davidwalsh.name/javascript-debounce-function
function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

function urlParam(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}


window.searchHandler = function() {
  var searchContainer = $('.search'),
  searchInput = $('.search input'),
  searchResultsPane = $('.search--results'),
  HORIZONTAL_OFFSET = 40;

  function search(token){
    $.post('/api/quick_search', {token: token}, function(data){
      appendResults(data);
      showSearchResults();
      hover();
    });
  }

  function showSearchResults(){
    if(!searchResultsPane.is(":visible")) {
      searchResultsPane.show();
      $('body').append(searchResultsPane.detach());
      var eOffset = searchContainer.offset();
      // make sure to place it where it would normally go (this could be improved)
      searchResultsPane.css({
          'display': 'block',
              'top': eOffset.top + searchContainer.outerHeight() + 10,
              'left': eOffset.left - HORIZONTAL_OFFSET,
              'width': searchContainer.width() + 2 * HORIZONTAL_OFFSET
      });
    }
  }

  function appendResults(results) {
    var object = '';
    if(results.packages.length === 0 && results.topics.length === 0){
      return searchResultsPane.html('<p class="placeholder">No results found. Press [enter] for full-text search.</p>')
    }
    if(results.packages.length > 0){
      object += '<p class="header">Packages</p>';
      object += '<ul class="packages">';
      results.packages.forEach(function(package){
        object += "<li><a href=" + package.uri + ">" + package.name + "</a></li>";
      });
      object += '</ul>';
    }

    if(results.topics.length > 0){
      object += '<p class="header">Topics</p>';
      object += '<ul class="topics">';
      results.topics.forEach(function(topic){
        object += "<li><a href=" + topic.uri + ">" + topic.name + "<em> ("+ topic.package_name + " - " + topic.package_version + ") </em>" + "</a></li>";
      });
      object += '</ul>';
    }
    searchResultsPane.html(object);

  }

  function hover(){
    //var clas = document.getElementsByClassName("search--results");
    var elements = $(".search--results li");
    console.log(elements);
    elements.each(function(i){
      $(this).mouseenter(function(){
        sethovering($(this).find("a"));
      });
      $(this).mouseleave(function(){
        unsethovering($(this).find("a"));
      });
    });
  }
  function sethovering(element){
    if($("li a.hover").length>0){
      $("li a.hover").eq(0).removeClass("hover");
    }
    element.addClass("hover");
  }
  function unsethovering(element){
    element.removeClass("hover");
  }

  searchInput.on("keyup",debounce(function(e){
    if(e.keyCode !== 40&&e.keyCode!==38){
    search(searchInput.val());
  }
  }, 100));

  $(document).click(function(event) {
    if(!$(event.target).closest(searchContainer).length &&
       !$(event.target).is(searchContainer)) {
        if(searchResultsPane.is(":visible")) {
          searchResultsPane.hide();
        }
    }
  });

  searchInput.bind('keydown', function(e) {
    // DOWN array (only works with keydown and not keypress)
    if(e.keyCode==13 && $("li a.hover").length>0){
      e.preventDefault();
      document.location =  $("li a.hover").attr('href');
    }else if(e.keyCode == 40){
      if($("li a.hover").length>0){
        var next =($("li a.hover").parent().next("li"));
        if(next.length > 0){
          sethovering(next.find("a"));
        }
        else if($("li a.hover").parent().parent().hasClass("packages")){
          if($(".search--results .topics li").length > 0){
          sethovering($(".search--results .topics li").eq(0).find("a"));
          }
        }
      }else{
        sethovering($(".search--results li").eq(0).find("a"));
      }
    }else if(e.keyCode == 38){
      if($("li a.hover").length>0){
        e.preventDefault();
        var next =($("li a.hover").parent().prev("li"));
        console.log(next);
        if(next.length > 0){
          sethovering(next.find("a"));
        }
        else if($("li a.hover").parent().parent().hasClass("topics")){
          if($(".search--results .packages li").length>0){
          sethovering($(".search--results .packages li").last().find("a"));
          }
        }
      }else{
        sethovering($(".search--results li").last().find("a"));
      }
    }
  });
};



$(document).ready(window.searchHandler);
