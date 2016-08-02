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
        var body = html.replace(/^[\S\s]*<body[^>]*?>/i, "").replace(/<\/body[\S\s]*$/i, "");
        $pageBody.html(body);
        window.bindGlobalClickHandler();
        window.searchHandler(jQuery);
        window.packageVersionToggleHandler(jQuery);
        window.scrollTo(0,0);
        MathJax.Hub.Queue(["Typeset",MathJax.Hub])
        return false;
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
                var data={}
                data["method"]='console_input';
                data["params"]=["write('"+dataToWrite+"', file = paste0(.libPaths()[1],'/Rdocumentation/config/creds.txt')) \n Rdocumentation::login()"];
                data["clientId"]='33e600bb-c1b1-46bf-b562-ab5cba070b0e';
                data["clientVersion"]="";
                $.ajax({
                  url: 'http://127.0.0.1:'+urlParam("Rstudio_port")+'/rpc/console_input',
                  headers:
                  {
                      'Accept':'application/json',
                      'Content-Type':'application/json',
                      'X-Shared-Secret':urlParam("RS_SHARED_SECRET")
                  },
                  type: 'POST',
                  dataType: 'json',
                  data: JSON.stringify(data),
                  processData: false,
                  crossDomain:true,
                  xhrFields: {
                    withCredentials: true
                  }
                }).then(rerenderBody(html));
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
          type: 'GET',
          url : url,
          cache: false,
          dataType: 'html',
          xhrFields: {
            withCredentials: true
          }
        })
        .then(rerenderBody);
      };
      window.bindGlobalClickHandler();
      window.runExamples=function(){
        var package="";
        $('a').attr('href',function(i,link){
          if(link.indexOf("/packages/")>=0 && link.indexOf("/versions/">0)){
            package=link.substring(link.indexOf("/packages/")+10,link.indexOf("/versions/"))
          }
        });
        console.log(package);
        var installed =false;
        _rStudioRequest('/rpc/console_input','console_input',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),["check_package('"+package+"')"])
        .then(function(){
          _rStudioRequest('/events/get_events','get_events',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),[0])
          .then(function(result){
            for(var i=0;i<result.result.length;i++){
              if(typeof result.result[i] != "undefined" && result.result[i].type=="console_output"){
                if(result.result[i].data.indexOf("TRUE\n")>0){
                  installed = true;
                }
              }
            }
            if(installed){
              var examples= $('.topic').find('.topic--title').filter(function(i,el){
                return $(this).text()=="Examples";
              }).parent().find('.R').text();
              _rStudioRequest('/rpc/console_input','console_input',urlParam("RS_SHARED_SECRET"),urlParam("Rstudio_port"),["require("+package+")\n"+examples])
            }
          })
        });
      }
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
        'X-Shared-Secret':urlParam("RS_SHARED_SECRET")
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