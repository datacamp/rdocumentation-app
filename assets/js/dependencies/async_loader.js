(function($) {

  var sid = '';

  var responseHandler = function(successFn) {
    return function(data, textStatus, xhr) {
      var location = xhr.getResponseHeader('X-RStudio-Redirect');
      var sessionid = xhr.getResponseHeader('X-RStudio-Session');
      sid = sessionid;
      if(location) {
        window.replacePage(location, true, true);
      } else {
        successFn(data, textStatus, xhr);
      }
    };
  };

  bootAsyncLoader = function(){
    //extra login with ajax request is needed
    if(urlParam('viewer_pane') === '1' && window.alreadyChecked !== true){
      window.alreadyChecked=true;
      console.log('*********************** AJAX MODE ***********************');

      $.ajaxSetup({
        beforeSend: function (xhr)
        {
           xhr.setRequestHeader("X-RStudio-Session", sid);
           xhr.setRequestHeader("X-RStudio-Ajax",'true');
        }
      });
      //execute an ajax post request to login, this request must give back a 200 status code, otherwise it gets cancelled and the ajax doesn't keep the
      //cookie
      stayLoggedIn = function(creds){
        return $.ajax({
            type: 'POST',
            url: '/rstudio_login',
            data: creds,
            contentType:"application/x-www-form-urlencoded",
            xhrFields: {
              withCredentials: true
            },
            crossDomain:true
        });
      };
      if(urlParam('username')!==null){
        var creds = "username="+decodeURIComponent(urlParam('username'))+
          "&password=" + decodeURIComponent(urlParam("password"));
        stayLoggedIn(creds);
      }


      // Intercept all link clicks
      asyncClickHandler = function(e) {
        e.preventDefault();
        // Grab the url from the anchor tag
        var url = $(this).attr('href');
        return window.replacePage(url,true,true);
      };

      //rerender the body of the ajax retrieved url
      var rerenderBody = function(html,rebind, url){
        $('body').attr("url", url);
        $('#content').html(html);
        window.boot();
        if(rebind){
          classifyLinks();
          window.bindGlobalClickHandler();
        }
        window.bindButtonAndForms();
        window.searchHandler(jQuery);
        window.launchFullSearch();
        bindHistoryNavigation();
        window.scrollTo(0,0);
        $('.search--results').hide();
        packageVersionControl();
      };

      /************************************************************************************************************************************************
      rebinding and executing trough ajax requests
      ************************************************************************************************************************************************/

      window.bindGlobalClickHandler = function(){        //unbinding seems to fail a lot in the Rstudio browser?!->be sure not to bind twice
        $('a:not(.js-external)').each(function(){
          if(typeof($(this).attr('href')) != "undefined" &&
              $(this).attr('href').indexOf('/modalLogin')<0 &&
              $(this).attr('href').indexOf('#close-modal')<0
            ) {
            $(this).unbind('click').bind('click', asyncClickHandler);
          }
        });
      };

      bindSearchPaneClickHandler=function(){
        $('.search--results').find('a:not(.js-external)').unbind('click').bind('click',asyncClickHandler);
      };

      window.bindButtonAndForms= function(){
        $('#js-examples').unbind('click').bind('click',runExamples);
        $('#js-install').unbind('click').bind('click',installpackage);
        $('#js-hideviewer').unbind('click').bind('click',hideViewer);
        $('#js-makedefault').unbind('click').bind('click',setDefault);

        $( "form" ).each(function(){
          $(this).unbind('submit').bind('submit',function(event) {
            event.preventDefault();
            var action = $(this).attr('action');
            var type = $(this).attr('method') || 'post';

            var dataToWrite = $(this).serialize();

            window.pushHistory(action+"?"+dataToWrite)
            
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
              xhrFields: {
                withCredentials: true
              },
              crossDomain:true
            }).then(responseHandler(function(html, textData, xhr) {
                //normal handling
                var url = action + '?' + dataToWrite;
                rerenderBody(html,true, url);
              })
            );
            if(action.indexOf("/login")>-1){
              console.log(action)
              window.logInForRstudio(dataToWrite)
            }
          });
        });
      };
      window.logInForRstudio = function(loginData){
        return _rStudioRequest('/rpc/execute_r_code','execute_r_code',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),
          ["write('"+ loginData +"', file = paste0(find.package('Rdocumentation'),'/config/creds.txt')) \n Rdocumentation::login()"])
        .then(function(){
          console.log("Stored creds in RStudio");
          return stayLoggedIn(loginData);
        });
      };

      // Helper function to grab new HTML
      // and replace the content
      window.replacePage = function(url,rebind,addToHistory) {
        if(url.indexOf('#')>=0){
          url = url.substring(url.indexOf('#'),url.length);
          document.getElementById(url).scrollIntoView();
        }
        else{
          url = url.replace("../","");
          if(url.charAt(0)!="/"){
            url ="/"+url;
          }
          var base = $('base').attr('href');
          var urlWParams = (url.indexOf('?')>-1)? url+"&" : url +"?";
          urlWParams = urlWParams +'rstudio_layout=1&viewer_pane=1&RS_SHARED_SECRET=' + urlParam("RS_SHARED_SECRET")+"&Rstudio_port=" + urlParam("Rstudio_port");
          return $.ajax({
            url : base +urlWParams,
            type: 'GET',
            dataType:"html",
            Accept:"text/html",
            cache: false,
            xhrFields: {
              withCredentials: true
            },
            crossDomain:true,
            success: responseHandler(function(data, textStatus, xhr) {
              if(addToHistory){
                window.pushHistory(url);
              }
              rerenderBody(data,rebind, urlWParams);
            })
          })
          .fail(function(error) {console.log(error.responseJSON); });
        }

      };

      /************************************************************************************************************************************************
      button press functions (running examples, installing packages);
      ************************************************************************************************************************************************/
      runExamples=function(e){
        e.preventDefault();
        var package = $(".packageData").data("package-name");
        var version = $(".packageData").data("latest-version");
        checkPackageVersion(package,version).then(function(installed){
          if(installed===0|| installed==-1){
            var examples= $('.topic').find('.topic--title').filter(function(i,el){
              return $(this).text()=="Examples";
            }).parent().find('.R').text();
            _rStudioRequest('/rpc/console_input','console_input',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),["require("+package+")\n"+examples]);
          }
        });
        return false;
      };

      setDefault=function(e){
        e.preventDefault();
        _rStudioRequest('/rpc/console_input','console_input',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),["Rdocumentation::makeDefault()"]);
        return false;
      };
      hideViewer=function(e){
        e.preventDefault();
        _rStudioRequest('/rpc/console_input','console_input',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),["Rdocumentation::hideViewer()"]);
        return false;
      };
      /************************************************************************************************************************************************
      checking installation of package and package version
      ************************************************************************************************************************************************/
      checkPackageVersion=function(package,version){
        version = String(version).replace("-",".")
        return _rStudioRequest('/rpc/execute_r_code','execute_r_code',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),["check_package('"+package+"','"+version+"')"])
        .then(function(result){
            return parseInt(result.result);
        });
      };

      packageVersionControl=function(){
        var packageName = $(".packageData").data("package-name");
        var version = $(".packageData").data("latest-version");
        if(packageName){
          checkPackageVersion(packageName,version).then(function(installed){
            if(installed==1){
              $('.versionCheck').html('<button type="button" id="js-install" class="btn btn-large pull-right btn-primary js-external">Install</button>');
              $('.visible-installed').hide();
            }
            else if(installed==-1){
              $('.versionCheck').html('<button type="button" id="js-install" class="btn btn-large pull-right btn-primary js-external">Update</button>');
            }
            else{
              $('.versionCheck').html('<i class="fa fa-check icon-green" aria-hidden="true"></i><span class="latest">You have the latest version<span>');
            }
            $('#js-install').unbind('click',installpackage);
            $('#js-install').bind('click',installpackage);
          });
        }
      };

      installpackage=function(e){
        e.preventDefault();
        var packageName = $(".packageData").data("package-name");
        var packageSource= $(".packageData").data("type-id");
        _rStudioRequest('/rpc/console_input','console_input',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),
                  ["install_package('"+packageName+"',"+packageSource+")"]);
        return false;
      };

      window.setTab=function(e,ui){
        $('ul.tabs').find('a').each(function(){
          $(this.hash).hide();
        });
        var link = ui.tab[0].innerHTML;
        link = link.substring(link.indexOf('#'),link.indexOf('" class'));
        $(link).show();
        e.preventDefault();
      };

      classifyLinks=function(){
        var base = $('base').attr('href');
        $('a:not(.js-external)').map(function(){
          var link =$(this).attr("href");
          if(typeof(link) != "undefined" && link.indexOf(base)<=-1 && (link.indexOf("www")===0  || link.indexOf("http://")===0 || link.indexOf("https://") === 0)){
            $(this).addClass("js-external");
          }
        });
      };

      window.executePackageCode=function(package,code){
        _rStudioRequest('/rpc/console_input','console_input',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),["require("+package+")\n"+code]);
      };
      //check the packageversion
      packageVersionControl();
      classifyLinks();
      window.bindGlobalClickHandler();
      window.bindButtonAndForms();
      window.scrollTo(0,0);
    }
  };

  _rStudioRequest=function(url,method,shared_secret,port,params){
    var data={};
    data.method = method;
    //data.params = [$('.R').text()];
    data.params = params;
    data.clientId = '33e600bb-c1b1-46bf-b562-ab5cba070b0e';
    data.clientVersion = "";

    return $.ajax({
      url: 'http://127.0.0.1:'+port+url,
      headers:
      {
          'Accept':'application/json',
          'Content-Type':'application/json',
          'X-Shared-Secret':shared_secret
      },
      type: 'POST',
      dataType: 'json',
      data: JSON.stringify(data),
      processData: false,
      crossDomain:true,
      xhrFields: {
        withCredentials: true
      }
    });
  };
})($jq);
