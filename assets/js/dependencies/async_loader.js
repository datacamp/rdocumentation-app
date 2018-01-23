(function ($) {
  
  var containerType = 'web-iframe';
  var booted = false;

  Loader = {

    configure: function (containerType) {
      Loader.containerType = containerType;
      /*
      setting up the ajax requests, each request is crossDomain, and it needs to contain the X-Rstudio-session header for cookies and X-Rstudio-Ajax
      to give back the rstudio-layout
      */
      $.ajaxSetup({
        cache: false,
        crossDomain: true
      });
      /*
      Need to rebind everything when the DOM changes
      */
      $(document).bind("content-changed", function () {
        Binder.bindGlobalClickHandler();
      });

    },
    /*
    responseHandler to handle the redirects and to store the sessionId when replacing the page in rstudio
    */
    responseHandler: function (successFn, addToHistory) {
      return function (data, textStatus, xhr) {
        successFn(data, textStatus, xhr);
      };
    },

     // Intercept all link clicks
    asyncClickHandler: function (e) {
      e.preventDefault();
      // Grab the url from the anchor tag
      var url = $(this).attr('href');
      return Loader.replacePage(url, true);
    },

   /*
    Helper function to grab new HTML
    and replace the content
    */
    replacePage: function (url, addToHistory) {
      var urlWParams = Loader.addParams(url);
      return $.ajax({
        url : urlWParams,
        type: 'GET',
        dataType: "html",
        Accept: "text/html",
        success: Loader.responseHandler(function (data, textStatus, xhr) {
          if(addToHistory) {
            window.pushHistory(url);
          }
          Loader.rerenderBody(data, urlWParams);
        },addToHistory)
      })
      .fail(function (error) {console.log(error.responseJSON); });
    },


    //rerender the body of the ajax retrieved url
    rerenderBody: function (html,url) {
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
      window.scrollTo(0, 0);
      $(document).trigger('content-changed');
    },

    /*
    help function to add the parameters to the url
    */
    addParams: function (url) {
      var urlWParams = (url.indexOf('?') > -1) ? url + '&' : url + '?';
      return urlWParams + 'viewer_pane=1&campus_app=1';
    },

    runExample: function (packageName, code) {
      var payload = 'require(' + packageName + ')\n' + code;
      parent.postMessage(payload, '*');
    }
  };

  Campus = {
    start: function () {
      var packageName = $('.campus-data').data("package");
      var topic = $('.campus-data').data("topic");

      var path = $('.campus-data').data("path") || '/goto/'+ packageName + '/' + topic;
      //load the first page
      Loader.replacePage(decodeURIComponent(path), false).then(function () {
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
  var rebind = function (element,event,functionToBind) {
    $(element).unbind(event).bind(event,functionToBind);
  };

  /*
  Helper function to classify internal and external links
  */
  var classifyLinks = function () {
    var base = $('base').attr('href');
    $('a:not(.js-external)').map(function () {
      var link =$(this).attr("href");
      if(typeof(link) != "undefined" &&
          link.indexOf(base)<=-1 &&
          (link.indexOf("www") === 0  || link.indexOf("http://") === 0 || link.indexOf("https://") === 0 || link.indexOf('/register') === 0)) {
        $(this).addClass("js-external");
      }
    });
    if(containerType !== 'rstudio') {
      $('a.js-external').map(function () {
        $(this).attr("target","_blank");
      });
    }
  };

  Binder = {
    bindLinks: function () {
      /*
      bind all links to ajax requests, (except the ones for the modal, which are already ajax request bound by jquery)
      */
      $('a:not(.js-external)').each(function () {
        if($(this).attr('href') !== undefined &&
            $(this).attr('href').indexOf('/modalLogin')<0 &&
            $(this).attr('href').indexOf('#close-modal')<0
          ) {
          rebind(this, 'click', Loader.asyncClickHandler);
        }
      });
    },

    bindExampleButton: function () {
      rebind('#js-examples', 'click', function (e) {
        e.preventDefault();
        var packageName = $(".packageData").data("package-name");
        var version = $(".packageData").data("latest-version");
        var examples= $('.topic').find('.topic--title').filter(function (i,el) {
          return $(this).text() === "Examples";
        }).parent().find('.R').text();
        Loader.runExample(packageName, examples);
      });
    },

    bindElements: function () {
       /*
      bind elements on specific pages to special behaviour for the viewer pane
      */

      rebind('.top-collab-list','change',function () {
        Binder.bindLinks();
      });

      rebind('#packageVersionSelect','change', function () {
        var url = $(this).find('option:selected').data('uri');
        Loader.replacePage(url,false);
      });
    },

    bindModals: function () {
      /*
      rebind the modals to work with rstudio
      */
      var bindModalSubmit = function (callback) {
        $("#modalLoginButton").click(callback);
        $("#username").keypress(function (e) {
          if(e.which === 13) {
            callback();
          }
        });
        $("#password").keypress(function (e) {
          if(e.which === 13) {
            callback();
          }
        });
      };
      var bindModalWhenLoaded = function (modalId, callback) {
        rebind(modalId,'modal:ajax:complete',function () {
          bindModalSubmit(function () {
          var auth = $(".authentication--form").serialize();
            $.post("/modalLogin",auth,function (json, status, xhr) {
              var status = json.status;
              if(status === "success") {
                $.modal.close();
                callback();
              }else if(status === "invalid") {
                if($(".modal").find(".flash-error").length === 0) {
                $(".modal").prepend("<div class = 'flash flash-error'>Invalid username or password.</div>");
                }
              }
            });
          });
        });
      };

      bindModalWhenLoaded('#openModalExample', function () {
        $(".example--form form").submit();
      });

      bindModalWhenLoaded('#openModalUpvote', function () {
        $.post($('#openModalUpvote').data('action'), function () {
          Loader.replacePage('/packages/'+$(".packageData").data("package-name")+'/versions/'+ $(".packageData").data("latest-version"),false);
        });
      });
    },

    bindForms: function () {
      /*
      bind all forms to ajax requests
      */
      rebind('form', 'submit', function (event) {
        event.preventDefault();
        var action = $(this).attr('action');
        var type = $(this).attr('method') || 'post';

        var dataToWrite = $(this).serialize();

        if(type.toUpperCase() == 'GET') {
          window.pushHistory(action + "?" + dataToWrite);
        }

        dataToWrite = dataToWrite+
          '&viewer_pane=1';
        $.ajax({
          type: type,
          url: action,
          headers: {
            Accept : "text/html; charset=utf-8",
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
          },
          data: dataToWrite,
          contentType:"application/x-www-form-urlencoded"
        }).then(Loader.responseHandler(function (html, textData, xhr) {
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
    bindGlobalClickHandler: function () {

      classifyLinks();

      Binder.bindLinks();

      Binder.bindExampleButton();

      Binder.bindElements();

      bindHistoryNavigation();

      Binder.bindModals();
      Binder.bindForms();
    }
  };


    /*
  function that gets called on each pageload
  */
  bootAsyncLoader = function () {
    //extra login with ajax request is needed
    if(urlParam('viewer_pane') === '1' && !booted) {
      console.log('*********************** AJAX MODE ***********************');
      booted = true;
      Loader.configure(containerType);
      Campus.start();
    }
  };

})($jq);
