(function($) {
  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  // Source: https://davidwalsh.name/javascript-debounce-function
  window.debounce = function(func, wait, immediate) {
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



  window.searchHandler = function() {
    var searchContainer = $('.search'),
    searchInput = $('.search input'),
    oldInput = searchInput.val(),
    searchResultsPane = $('.search--results'),
    HORIZONTAL_OFFSET = 40;

    function search(token){
      $.post('/api/quick_search', {token: token}, function(data){
        if(searchContainer.parents('html').length > 0 && token == searchInput.val()) {
          appendResults(data);
          showSearchResults();
          hover();
        }
      });
    }

    function showSearchResults(){
      if(!searchResultsPane.is(":visible")) {
        searchResultsPane.show();
        $('#content').append(searchResultsPane.detach());
        var eOffset = searchContainer.offset();
        // make sure to place it where it would normally go (this could be improved)
        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        searchResultsPane.css({
            'display': 'block',
            'top': eOffset.top + searchInput.outerHeight() + 10,
            'left': eOffset.left - HORIZONTAL_OFFSET,
            'width': searchContainer.width() + 2 * HORIZONTAL_OFFSET,
            'max-height': h - (eOffset.top + searchInput.outerHeight() + 10)

        });
      }
    }

    function appendResults(results) {
      var object = '';
      if(results.packages.length === 0 && results.topics.length === 0 && results.collaborators.length === 0){
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
        object += '<p class="header">Functions</p>';
        object += '<ul class="topics">';
        results.topics.forEach(function(topic){
          object += "<li><a href=" + topic.uri + ">" + topic.name + "<em> ("+ topic.package_name + " - " + topic.package_version + ") </em>" + "</a></li>";
        });
        object += '</ul>';
      }

      if(results.collaborators.length > 0){
        object += '<p class="header">Collaborators</p>'
        object += '<ul class="collaborators">';
        results.collaborators.forEach(function(collaborator){
          object += "<li><a href=" + collaborator.uri + ">" + collaborator.name + "</a></li>";
        });
        object += '</ul>'; 
      }
      searchResultsPane.html(object);
    }

    function hover(){
      var elements = $(".search--results li");
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

    function binding() {
      searchInput.on("keyup",debounce(function(e){
        if(searchInput.val()==""){
          searchResultsPane.hide();
        }
        else if(e.keyCode !== 40&&e.keyCode!==38&&oldInput!==searchInput.val()){
          oldInput = searchInput.val();
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
            }else if($("li a.hover").parent().parent().hasClass("packages")){
              if($(".search--results .topics li").length > 0){
              sethovering($(".search--results .topics li").eq(0).find("a"));
              }
            }else if($("li a.hover").parent().parent().hasClass("topics")){
              if($(".search--results .collaborators li").length > 0){
              sethovering($(".search--results .collaborators li").eq(0).find("a"));
              }
            }
          }else{
            sethovering($(".search--results li").eq(0).find("a"));
          }
        }else if(e.keyCode == 38){
          if($("li a.hover").length>0){
            e.preventDefault();
            var next =($("li a.hover").parent().prev("li"));
            if(next.length > 0){
              sethovering(next.find("a"));
            }
            else if($("li a.hover").parent().parent().hasClass("topics")){
              if($(".search--results .packages li").length>0){
              sethovering($(".search--results .packages li").last().find("a"));
              }
            }
            else if($("li a.hover").parent().parent().hasClass("collaborators")){
              if($(".search--results .topics li").length>0){
              sethovering($(".search--results .topics li").last().find("a"));
              }
            }
          }else{
            sethovering($(".search--results li").last().find("a"));
          }
        }
      });
    }

    binding();



  };



  $(document).ready(window.searchHandler);
})($jq);
