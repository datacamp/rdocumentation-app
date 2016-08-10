  $(function() {
    if(urlParam('viewer_pane') === '1'){
      console.log('*********************** AJAX MODE ***********************');
      var $pageBody = $('body');
      window.loggedIn = false;
      // Intercept all link clicks
      window.asyncClickHandler = function(e) {
        e.preventDefault();
        // Grab the url from the anchor tag
        var url = $(this).attr('href');
        return window.replacePage(url);
      }

      function rerenderBody(html){
        console.log(html);
        var body = html.replace(/^[\S\s]*<body[^>]*?>/i, "").replace(/<\/body[\S\s]*$/i, "");
        $pageBody.html(body);
        window.bindGlobalClickHandler();
        window.searchHandler(jQuery);
        window.packageVersionToggleHandler(jQuery);
        window.scrollTo(0,0);
        MathJax.Hub.Queue(["Typeset",MathJax.Hub])
        return false;
      }

      /************************************************************************************************************************************************
      rebinding and executing trough ajax requests
      ************************************************************************************************************************************************/

      window.bindGlobalClickHandler = function(){
        $('a:not(.js-external)').unbind('click').bind('click', window.asyncClickHandler);
        $('#js-examples').unbind('click').bind('click',window.runExamples);
        $('#js-install').unbind('click').bind('click',window.installpackage);
        $('#js-hideviewer').unbind('click').bind('click',window.hideViewer);
        $('#js-makedefault').unbind('click').bind('click',window.setDefault);
        $( "form" ).submit(function( event ) {
            event.preventDefault();
            var action = $("form")[0].action;
            var type = "GET";
            if (typeof $("form")[1] != 'undefined'){
              action = $("form")[1].action;
              type = "POST";
            }
            var dataToWrite= $(this).serialize();
            $.ajax({
              type: type,
              url: action,
              data: dataToWrite,
              contentType:"application/x-www-form-urlencoded",
              crossDomain:true,
              xhrFields: {
                withCredentials: true
              }
            }).then(function(html,textData,xhr){
              if(action.indexOf("/login")>-1 && !window.loggedIn){
                window.loggedIn=true;
                _rStudioRequest('/rpc/console_input','console_input',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),
                  ["write('"+dataToWrite+"', file = paste0(.libPaths()[1],'/Rdocumentation/config/creds.txt')) \n Rdocumentation::login()"])
                .then(rerenderBody(html));
              }
              else{
                rerenderBody(html);
              }
            });
        });
      };

      // Helper function to grab new HTML
      // and replace the content
      window.replacePage = function(url) {
        console.log("replacing " + url);
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
            url = url + '&viewer_pane=1&Rstudio_XS_Secret=' + urlParam("Rstudio_XS_Secret")+"&Rstudio_port=" + urlParam("Rstudio_port");
          }
          else{
            url=url+'?viewer_pane=1&Rstudio_XS_Secret=' + urlParam("Rstudio_XS_Secret")+"&Rstudio_port=" + urlParam("Rstudio_port");
          }
          return $.ajax({
            url : url,
            type: 'GET',
            dataType:'html',
            cache: false,
            xhrFields: {
              withCredentials: true
            },
            crossDomain:true
          })
          .then(rerenderBody)
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
          if(installed!=false){
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

      window.checkPackageVersion=function(package){
        var installed =true;
        var found=false;
        return _rStudioRequest('/rpc/console_input','console_input',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),["check_package('"+package+"')"])
        .then(function(){
          return _rStudioRequest('/events/get_events','get_events',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),[0])
          .then(function(result){
            for(var i=0;i<result.result.length;i++){
              if(typeof result.result[i] != "undefined" && result.result[i].type=="console_output"){
                if(result.result[i].data.indexOf("FALSE\n")>0){
                  installed = false;
                }
                else{
                  installed=result.result[i].data;
                }
                found=true;
              }
            }
            //Rstudio runs the get_events request periodically. It could happen that we accidently missed the response(small chance), so run it again then
            if(!found){
              installed = window.checkPackageVersion(package);
            }
            return installed;
          })
        });
      };

      window.packageVersionControl=function(){
        var versions = $('#packageVersionSelect').find('option');
        if(versions.length>0){
          var packageName = $(".packageData").data("package-name");
          window.checkPackageVersion(packageName).then(function(installed){
            if(installed==false){
              $('.versionCheck').html('<button type="button" id="js-install" class="btn btn-primary js-external">Install</button>');
            }
            else{
              installedVersion=installed.split(/[´`'"’‘]+/)[1];
              installedVersion=installedVersion.replace('-','.');
              var upToDate=true;
              for(var i=0;i<versions.length;i++){
                if($(versions[i]).text().trim()!="@VERSION@"&& _versionCompare($(versions[i]).text().trim(),installedVersion)){
                  $('.versionCheck').html('<button type="button" id="js-install" class="btn btn-primary js-external">Update</button>');
                  upToDate=false
                }
              }
              if(upToDate){

                $('.versionCheck').html('<i class="fa fa-check icon-green" aria-hidden="true"></i><span class="latest">You have the latest version<span>');
              }
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
      }
      //check the packageversion
      window.packageVersionControl();
      window.bindGlobalClickHandler();
      window.scrollTo(0,0);
    }
  });

_rStudioRequest=function(url,method,shared_secret,port,params){
  var data={}
  data["method"]=method;
  //data["params"]=[$('.R').text()];
  data["params"]=params;
  data["clientId"]='33e600bb-c1b1-46bf-b562-ab5cba070b0e';
  data["clientVersion"]="";
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
}
_versionCompare = function (v1, v2) {
    v1parts = v1.split(/[.-]+/);
    v2parts = v2.split(/[.-]+/);
    while (v1parts.length < v2parts.length) v1parts.push("0");
    while (v2parts.length < v1parts.length) v2parts.push("0");
    v1parts = v1parts.map(Number);
    v2parts = v2parts.map(Number);
    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return true;
        }

        if (v1parts[i] == v2parts[i]) {
            continue;
        }
        else if (v1parts[i] > v2parts[i]) {
            return true;
        }
        else {
            return false;
        }
    }

    if (v1parts.length != v2parts.length) {
        return false;
    }

    return 0;
}
