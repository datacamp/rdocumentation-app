(function($) {

  var sid = '';
  var containerType = $('.rstudio-data')[0] ? 'rstudio' : 'web-iframe';
  var booted = false;

  Loader = {

    configure: function(containerType) {
      /*
      setting up the ajax requests, each request is crossDomain, and it needs to contain the X-Rstudio-session header for cookies and X-Rstudio-Ajax
      to give back the rstudio-layout
      */
      $.ajaxSetup({
        beforeSend: function (xhr)
        {
           xhr.setRequestHeader("X-RStudio-Session", sid);
           xhr.setRequestHeader("X-RStudio-Ajax",'true');
        },
        cache:false,
        crossDomain:true
      });
      /*
      Need to rebind everything when the DOM changes
      */
      $(document).bind("content-changed",function(){
        Binder.bindGlobalClickHandler();
      });

    },
    /*
    responseHandler to handle the redirects and to store the sessionId when replacing the page in rstudio
    */
    responseHandler: function(successFn,addToHistory) {
      return function(data, textStatus, xhr) {
        var location = xhr.getResponseHeader('X-RStudio-Redirect');
        var sessionid = xhr.getResponseHeader('X-RStudio-Session');
        sid = sessionid;
        if(location) {
          Loader.replacePage(location,addToHistory);
        } else {
          successFn(data, textStatus, xhr);
        }
      };
    },

     // Intercept all link clicks
    asyncClickHandler: function(e) {
      e.preventDefault();
      // Grab the url from the anchor tag
      var url = $(this).attr('href');
      return Loader.replacePage(url, true);
    },

   /*
    Helper function to grab new HTML
    and replace the content
    */
    replacePage: function(url, addToHistory) {
      urlWParams = Loader.addParams(url);
      return $.ajax({
        url : urlWParams,
        type: 'GET',
        dataType: "html",
        Accept: "text/html",
        success: Loader.responseHandler(function(data, textStatus, xhr) {
          if(addToHistory){
            window.pushHistory(url);
          }
          Loader.rerenderBody(data, urlWParams);
        },addToHistory)
      })
      .fail(function(error) {console.log(error.responseJSON); });
    },


    //rerender the body of the ajax retrieved url
    rerenderBody: function(html,url){
      $('body').attr("url", url);
      $('#content').html(html);
      window.boot();
      /*
      fit quicksearch
      */
      window.searchHandler();
      /*
      launch search if needed
      */
      window.launchFullSearch();
      window.scrollTo(0,0);
      $('.search--results').hide();
      $(document).trigger('content-changed');
    },

    /*
    help function to add the parameters to the url
    */
    addParams: function(url){
      var urlWParams = (url.indexOf('?')>-1)? url+"&" : url +"?";
      if(containerType === 'rstudio') {
        return urlWParams +'rstudio_layout=1&viewer_pane=1&RS_SHARED_SECRET=' + urlParam("RS_SHARED_SECRET")+"&Rstudio_port=" + urlParam("Rstudio_port");
      } else {
        return urlWParams + 'viewer_pane=1';
      }
    },

    runExample: function(packageName, code) {
      if(containerType === 'rstudio') {
        RStudioRequests.executePackageCode(packageName, code);
      } else {
        var payload = "require("+packageName+")\n"+code;
        parent.postMessage(payload, '*');
      }
    }


  };

  RStudio = {
    stayLoggedIn: function(creds){
      return $.ajax({
          type: 'POST',
          url: '/rstudio_login',
          data: creds,
          contentType:"application/x-www-form-urlencoded",
        });
    },

    configureLogin: function() {
     $( document ).ajaxSend(function(event, jqxhr, settings ) {
        if(settings.type=="POST" && settings.url.indexOf('/login')>-1){
          RStudioRequests.logInForRstudio(settings.data);
        }
      });


    },

    start: function () {
      /*
      execute an ajax post request to login, this request must give back a 200 status code,
      otherwise it gets cancelled and the ajax doesn't keep the cookie
      */
      if(urlParam('username')!==null){
        var creds = "username="+decodeURIComponent(urlParam('username'))+
                    "&password=" + decodeURIComponent(urlParam("password"));
        RStudio.stayLoggedIn(creds).then(Loader.responseHandler(function(){
        //load the first page, because the first request comes from the view function of the rstudio-controller and contains data tags for the post request
         RStudio.loadFirstPage();
        },false));
      }
      else{
        //load the first page, because the first request comes from the view function of the rstudio-controller and contains data tags for the post request
        RStudio.loadFirstPage();
      }
    },

     /*
    first page is specified by the view function of the Rstudiocontroller in data attributes,
    execute a post request to the specified page with the attributes on first page load.
    */
    loadFirstPage: function(){
      var data = $('.rstudio-data').data();
      var url = Loader.addParams('/rstudio/'+data.called_function);
      return $.ajax({
        url : url,
        type: 'POST',
        contentType:"application/json",
        data: JSON.stringify(data),
        Accept:"text/html",
        success: Loader.responseHandler(function(data, textStatus, xhr) {
          Loader.rerenderBody(data,url);
        },false)
      })
      .fail(function(error) {console.log(error.responseJSON); }).then(function(){
        /*
        remove the data tags
        */
        $('.rstudio-data').remove();
      });
    }

  };

  /************************************************************************************************************************************************
  rebinding and executing trough ajax requests
  ************************************************************************************************************************************************/

  /*
  help function to rebind functions to event on certain elements
  */
  var rebind = function(element,event,functionToBind){
    $(element).unbind(event).bind(event,functionToBind);
  };

  /*
  Helper function to classify internal and external links
  */
  var classifyLinks = function(){
    var base = $('base').attr('href');
    $('a:not(.js-external)').map(function(){
      var link =$(this).attr("href");
      if(typeof(link) != "undefined" &&
          link.indexOf(base)<=-1 &&
          (link.indexOf("www")===0  || link.indexOf("http://")===0 || link.indexOf("https://") === 0 || link.indexOf('/register') === 0)){
        $(this).addClass("js-external");
      }
    });
  };

  Binder = {
    bindLinks: function() {
      /*
      bind all links to ajax requests, (except the ones for the modal, which are already ajax request bound by jquery)
      */
      $('a:not(.js-external)').each(function(){
        if(typeof($(this).attr('href')) != "undefined" &&
            $(this).attr('href').indexOf('/modalLogin')<0 &&
            $(this).attr('href').indexOf('#close-modal')<0
          ) {
          rebind(this, 'click', Loader.asyncClickHandler);
        }
      });
    },

    bindRStudioButtons: function() {
      RStudioRequests.packageVersionControl();
      rebind('#js-examples', 'click', RStudioRequests.runExamples);
      rebind('#js-install', 'click', RStudioRequests.installpackage);
      rebind('#js-hideviewer','click', RStudioRequests.hideViewer);
      rebind('#js-makedefault','click', RStudioRequests.setDefault);
    },

    bindExampleButton: function() {
      rebind('#js-examples', 'click', function(e) {
        e.preventDefault();
        var package = $(".packageData").data("package-name");
        var version = $(".packageData").data("latest-version");
        var examples= $('.topic').find('.topic--title').filter(function(i,el){
          return $(this).text()=="Examples";
        }).parent().find('.R').text();
        Loader.runExample(package, examples);
      });
    },

    bindElements: function() {
       /*
      bind elements on specific pages to special behaviour for the viewer pane
      */

      rebind('.top-collab-list','change',function(){
        Binder.bindLinks();
      });

      rebind('#packageVersionSelect','change', function(){
        var url = $(this).find('option:selected').data('uri');
        Loader.replacePage(url,false);
      });
    },

    bindModals: function(){
      /*
      rebind the modals to work with rstudio
      */
      var bindModalSubmit = function(callback){
        $("#modalLoginButton").click(callback);
        $("#username").keypress(function(e){
          if(e.which == 13){
            callback();
          }
        });
        $("#password").keypress(function(e){
          if(e.which == 13){
            callback();
          }
        });
      };
      rebind('#openModalExample','modal:ajax:complete',function(){
        bindModalSubmit(function(){
          var auth = $(".authentication--form").serialize();
          $.post("/modalLogin",auth,function(json){
            var status = json.status;
            if(status === "success"){
              if(containerType === 'rstudio') {
                RStudioRequests.logInForRstudio(auth).then(function(){
                  $.modal.close();
                  $(".example--form form").submit();
                });
              }
              else{
                $.modal.close();
                $(".example--form form").submit();
              }
            }else if(status === "invalid"){
              if($(".modal").find(".flash-error").length === 0){
              $(".modal").prepend("<div class = 'flash flash-error'>Invalid username or password.</div>");
              }
            }
          });
        });
      });
      rebind("#openModalUpvote",'modal:ajax:complete',function(){
        bindModalSubmit(function(){
          var auth = $(".authentication--form").serialize();
          $.post("/modalLogin",auth,function(json){
            var status = json.status;
            if(status === "success"){
              if(containerType === 'rstudio') {
                RStudioRequests.logInForRstudio(auth).then(function(){
                  $.modal.close();
                  $.post($('#openModalUpvote').data('action'), function(response) {
                    Loader.replacePage('/packages/'+$(".packageData").data("package-name")+'/versions/'+ $(".packageData").data("latest-version"),false);
                  });
                });
              }
              else{
                $.modal.close();
                  $.post($('#openModalUpvote').data('action'), function(response) {
                    Loader.replacePage('/packages/'+$(".packageData").data("package-name")+'/versions/'+ $(".packageData").data("latest-version"),false);
                });
              }
            }else if(status === "invalid"){
              if($(".modal").find(".flash-error").length === 0){
              $(".modal").prepend("<div class = 'flash flash-error'>Invalid username or password.</div>");
            }
            }
          });
        });
      });
    },

    bindForms: function() {
      /*
      bind all forms to ajax requests
      */
      rebind('form', 'submit', function(event) {
        event.preventDefault();
        var action = $(this).attr('action');
        var type = $(this).attr('method') || 'post';

        var dataToWrite = $(this).serialize();

        window.pushHistory(action+"?"+dataToWrite);

        dataToWrite = dataToWrite+
          '&viewer_pane=1'+
          '&RS_SHARED_SECRET=' + urlParam("RS_SHARED_SECRET")+
          "&Rstudio_port=" + urlParam("Rstudio_port");

        $.ajax({
          type: type,
          url: action,
          headers: {
            Accept : "text/html; charset=utf-8",
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
          },
          data: dataToWrite,
          contentType:"application/x-www-form-urlencoded",
        }).then(Loader.responseHandler(function(html, textData, xhr) {
            var url = action + '?' + dataToWrite;
            Loader.rerenderBody(html, url);
          },false)
        );
      });
    },
     /*
    This is the main function that rebinds all elements with specific behaviour for the viewer pane
    This function is called each time the DOM changes
    */
    bindGlobalClickHandler: function(){

      classifyLinks();

      Binder.bindLinks();

      if(containerType === 'rstudio'){
        /*
        check if the user has the latest version of the package if on package-page
        */
        Binder.bindRStudioButtons();
      } else {
        Binder.bindExampleButton();
      }

      Binder.bindElements();

      bindHistoryNavigation();

      Binder.bindModals();
      Binder.bindForms();
    }
  };


    /*
  function that gets called on each pageload
  */
  bootAsyncLoader = function(){
    //extra login with ajax request is needed
    if(urlParam('viewer_pane') === '1' && !booted){
      console.log('*********************** AJAX MODE ***********************');
      booted = true;
      Loader.configure(containerType);

      if(containerType === 'rstudio') {
        RStudio.configureLogin();
        RStudio.start();
      } else {
        Binder.bindGlobalClickHandler();
      }

    }
  };

})($jq);
