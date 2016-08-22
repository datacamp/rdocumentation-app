  $(function() {
    //extra login with ajax request is needed
    if(urlParam('viewer_pane') === '1' && !window.alreadyChecked==true){
      window.alreadyChecked=true;
      var creds = "username="+decodeURIComponent(getUrlVars()['username'])+"&password=" + decodeURIComponent(getUrlVars()["password"])
      if(getUrlVars()["username"]!=null && !window.loggedIn){
        $.ajax({
            type: 'POST',
            url: '/login',
            data: creds,
            contentType:"application/x-www-form-urlencoded",
            xhrFields: {
              withCredentials: true
            },
            crossDomain:true,
            success: function(data, textStatus, xhr) {
              if(xhr.status== 200){
                window.loggedIn = true
              }
            }
        })
      }
      console.log('*********************** AJAX MODE ***********************');
      var $pageBody = $('body');
      window.loggedIn = false;
      // Intercept all link clicks
      window.asyncClickHandler = function(e) {
        e.preventDefault();
        // Grab the url from the anchor tag
        var url = $(this).attr('href');
        return window.replacePage(url,true,true);
      }

      var rerenderBody = function(html,rebind, url){
        var body = html.replace(/^[\S\s]*<body[^>]*?>/i, "");
        body = body.replace(/<\/body[\S\s]*$/i, "");
        //apparently the rule below refires document.ready after replacing, thus the alreadyChecked boolean
        $('body').attr("url", url);
        $pageBody.html(body);
        if(rebind){
          window.classifyLinks();
          window.bindGlobalClickHandler();
        }
        window.bindButtonAndForms();
        window.searchHandler(jQuery);
        window.packageVersionControl();
        window.launchFullSearch();
        window.bindHistoryNavigation();
        window.scrollTo(0,0);
        MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
        $('.search--results').hide();
      };

      /************************************************************************************************************************************************
      rebinding and executing trough ajax requests
      ************************************************************************************************************************************************/

      window.bindGlobalClickHandler = function(){        //unbinding seems to fail a lot in the Rstudio browser?!->be sure not to bind twice
        $('a:not(.js-external)').each(function(){
          $(this).unbind('click').bind('click', window.asyncClickHandler);
        })
      };
      window.bindSearchPaneClickHandler=function(){
        $('.search--results').find('a:not(.js-external)').unbind('click').bind('click',window.asyncClickHandler);
      };

      window.bindButtonAndForms= function(){
        $('#js-examples').unbind('click').bind('click',window.runExamples);
        $('#js-install').unbind('click').bind('click',window.installpackage);
        $('#js-hideviewer').unbind('click').bind('click',window.hideViewer);
        $('#js-makedefault').unbind('click').bind('click',window.setDefault);
        $( "form" ).each(function(){
          $(this).unbind('submit').bind('submit',function(event) {
            event.preventDefault();
            var action = $(this)[0].action;
            var dataToWrite= $(this).serialize();
            var type = "GET";
            var history = action + "?"+dataToWrite
            if (!(action.indexOf("search")>-1)){
              type = "POST";
              var history=action
            }
            else{
              window.queryTime=new Date();
              dataToWrite= dataToWrite+'&viewer_pane=1&RS_SHARED_SECRET=' + urlParam("RS_SHARED_SECRET")+"&Rstudio_port=" + urlParam("Rstudio_port")
            }
            if(action.indexOf("/reviews")>-1){
              dataToWrite= dataToWrite+'&viewer_pane=1&RS_SHARED_SECRET=' + urlParam("RS_SHARED_SECRET")+"&Rstudio_port=" + urlParam("Rstudio_port")
            }
            window.pushHistory(history)
            $.ajax({
              type: type,
              url: action,
              data: dataToWrite,
              contentType:"application/x-www-form-urlencoded",
              xhrFields: {
                withCredentials: true
              },
              crossDomain:true,
              success: function(data, textStatus, xhr) {
                if(xhr.status==200){
                  return data;
                }
              }
            }).then(function(html,textData,xhr){
              var url = type === 'GET' ? action + '?' + dataToWrite : action;
              if(action.indexOf("/login")>-1 && !window.loggedIn){
                _rStudioRequest('/rpc/execute_r_code','execute_r_code',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),
                  ["write('"+dataToWrite+"', file = paste0(find.package('Rdocumentation'),'/config/creds.txt')) \n Rdocumentation::login()"])
                .then(rerenderBody(html,true, url));
              }
              else{
                rerenderBody(html,true, url);
              }
            });
          });
        });
      }

      // Helper function to grab new HTML
      // and replace the content
      window.replacePage = function(url,rebind,addToHistory) {
        if(addToHistory){
          window.pushHistory(url)
        }
        if(url.indexOf('#')>=0){
          url = url.substring(url.indexOf('#'),url.length);
          document.getElementById(url).scrollIntoView();
        }
        else{
          url = url.replace("../","");
          if(url.charAt(0)!="/"){
            url="/"+url;
          }
          var base = $('base').attr('href');
          if(url.indexOf('?')>-1){
            url = url + '&viewer_pane=1&RS_SHARED_SECRET=' + urlParam("RS_SHARED_SECRET")+"&Rstudio_port=" + urlParam("Rstudio_port");
          }
          else{
            url=url+'?viewer_pane=1&RS_SHARED_SECRET=' + urlParam("RS_SHARED_SECRET")+"&Rstudio_port=" + urlParam("Rstudio_port");
          }
          return $.ajax({
            url : base +url,
            type: 'GET',
            dataType:"html",
            cache: false,
            xhrFields: {
              withCredentials: true
            },
            crossDomain:true,
            success: function(data, textStatus, xhr) {
              rerenderBody(data,rebind, url);
            }
          })
          .fail(function(error) {console.log(error.responseJSON) });
        }

      };

            /************************************************************************************************************************************************
      button press functions (running examples, installing packages);
      ************************************************************************************************************************************************/
      window.runExamples=function(e){
        e.preventDefault();
        var package = $(".packageData").data("package-name");
        window.checkPackageVersion(package).then(function(installed){
          if(installed==0|| installed==-1){
            var examples= $('.topic').find('.topic--title').filter(function(i,el){
              return $(this).text()=="Examples";
            }).parent().find('.R').text();
            _rStudioRequest('/rpc/console_input','console_input',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),["require("+package+")\n"+examples])
          }
        });
        return false;
      };

      window.setDefault=function(e){
        e.preventDefault();
        _rStudioRequest('/rpc/console_input','console_input',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),["Rdocumentation::makeDefault()"]);
        return false;
      };
      window.hideViewer=function(e){
        e.preventDefault();
        _rStudioRequest('/rpc/console_input','console_input',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),["Rdocumentation::hideViewer()"]);
        return false;
      };
      /************************************************************************************************************************************************
      checking installation of package and package version
      ************************************************************************************************************************************************/
      window.checkPackageVersion=function(package,version){
        return _rStudioRequest('/rpc/execute_r_code','execute_r_code',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),["check_package('"+package+"','"+version+"')"])
        .then(function(result){
            return parseInt(result.result)
        });
      };

      window.packageVersionControl=function(){
        var packageName = $(".packageData").data("package-name");
        var version = $(".packageData").data("latest-version");
        if(packageName){
          window.checkPackageVersion(packageName,version).then(function(installed){
            if(installed==1){
              $('.versionCheck').html('<button type="button" id="js-install" class="btn btn-large pull-right btn-primary js-external">Install</button>');
              $('#js-examples').hide()
            }
            else if(installed==-1){
              $('.versionCheck').html('<button type="button" id="js-install" class="btn btn-large pull-right btn-primary js-external">Update</button>');
            }
            else{
              $('.versionCheck').html('<i class="fa fa-check icon-green" aria-hidden="true"></i><span class="latest">You have the latest version<span>');
            }
            $('#js-install').unbind('click',window.installpackage);
            $('#js-install').bind('click',window.installpackage);
          });          
        }
      };

      window.installpackage=function(e){
        e.preventDefault();
        var packageName = $(".packageData").data("package-name");
        var packageSource= $(".packageData").data("type-id");
        _rStudioRequest('/rpc/console_input','console_input',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),
                  ["install_package('"+packageName+"',"+packageSource+")"])
        return false;
      };

      window.setTab=function(e,ui){
        $('ul.tabs').find('a').each(function(){
          $(this.hash).hide();
        });
        var link = ui.tab[0].innerHTML
        link = link.substring(link.indexOf('#'),link.indexOf('" class'));
        $(link).show();
        e.preventDefault();
      };

      window.classifyLinks=function(){
        var base = $('base').attr('href');
        $('a:not(.js-external)').map(function(){
          var link =$(this).attr("href")
          if(!link.indexOf(base)>-1 && (link.indexOf("www")==0  || link.indexOf("http://")==0 || link.indexOf("https://") == 0)){
            $(this).addClass("js-external");
          }
        });
      };
      //check the packageversion
      window.packageVersionControl();
      window.classifyLinks();
      window.bindGlobalClickHandler();
      window.bindButtonAndForms();
      window.scrollTo(0,0);
    }
  });

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

// Read a page's GET URL variables and return them as an associative array.
getUrlVars = function()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}
