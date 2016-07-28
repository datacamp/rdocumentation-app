$(function() {
  if(urlParam('viewer_pane') === '1'){
    console.log('*********************** AJAX MODE ***********************');
    console.log(urlParam("Rstudio_XS_Secret"))
    var $pageBody = $('body');

    // Intercept all link clicks
    window.asyncClickHandler = function(e) {
      e.preventDefault();
      // Grab the url from the anchor tag
      var url = $(this).attr('href');
      window.replacePage(url);
    }

    function rerenderBody(html){
      var body = html.replace(/^[\S\s]*<body[^>]*?>/i, "").replace(/<\/body[\S\s]*$/i, "");
      $pageBody.html(body);
      window.bindGlobalClickHandler();
      window.searchHandler(jQuery);
      window.packageVersionToggleHandler(jQuery);
      window.scrollTo(0,0);
      MathJax.Hub.Queue(["Typeset",MathJax.Hub])
    }

    window.bindGlobalClickHandler = function(){
      $('a:not(.js-external)').unbind('click', window.asyncClickHandler);
      $('a:not(.js-external)').bind('click', window.asyncClickHandler);
      $( "form" ).submit(function( event ) {
          event.preventDefault();
          var action = $("form")[0].action;
          var type = "GET";
          if (typeof $("form")[1] != 'undefined'){
            action = $("form")[1].action;
            type = "POST";
          }
          $.ajax({
            type: type,
            url: action,
            data: $( this ).serialize(),
            contentType:"application/x-www-form-urlencoded",
            crossDomain:true,
            xhrFields: {
              withCredentials: true
            }
          }).then(function(html){
            console.log(action);
            if(action.indexOf("/login")>-1){
              console.log("logging in")
              console.log("sending post request")
              console.log(urlParam("Rstudio_XS_Secret"))
              var xhttp = new XMLHttpRequest();
              console.log("sending xhttp");
              xhttp.open("POST", "/rpc/console_input", true);
              xhttp.setRequestHeader("Content-type", "application/json");
              xhttp.setRequestHeader("X-Shared-Secret","16816927778469308861804289383")

              xhttp.onreadystatechange = function () {
                console.log(xhttp.status);
                rerenderBody(html)
              };
              xhttp.send();
              // $.ajax({
              //   url: 'http://127.0.0.1:'+urlParam("Rstudio_port")+'/rpc/console_input',
              //   headers:
              //   {
              //       'Content-Type':'application/json',
              //       'X-Shared-Secret':urlParam("Rstudio_XS_Secret")
              //   },
              //   type: 'POST',
              //   datatype:'json',
              //   data: {method:'console_input', params:['print("hello")'], clientId:'33e600bb-c1b1-46bf-b562-ab5cba070b0e', clientVersion:""},
              //   contentType:'application/x-www-form-urlencoded',
              //   crossDomain:true,
              //   xhrFields: {
              //     withCredentials: true
              // }
              // }).then(rerenderBody(html));
            }
            else{
              rerenderBody(html);
            }            
          });
      });
    }

    // Helper function to grab new HTML
    // and replace the content
    window.replacePage = function(url) {
      var base = $('base').text();
      $.ajax({
        type: 'GET',
        url: base + url + '?viewer_pane=1&Rstudio_XS_Secret=' + urlParam("Rstudio_XS_Secret")+"&Rstudio_port=" + urlParam("Rstudio_port"),
        cache: false,
        dataType: 'html',
        xhrFields: {
          withCredentials: true
        }
      })
      .done(rerenderBody);
    };

    window.bindGlobalClickHandler();
  }


});