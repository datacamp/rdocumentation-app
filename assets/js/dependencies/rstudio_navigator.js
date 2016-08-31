(function($) {
  bootRstudioNavigator = function(){
    if(urlParam('viewer_pane') === '1' && !window.rstudioHistory){
      if(urlParam("history")==null){
        window.rstudioHistory = [];
        nextHistoryState = 0;
      }
      else{
        window.rstudioHistory=decodeURIComponent(urlParam("history")).split(",")
        nextHistoryState = 0;
      }
      window.pushHistory = function(url){
        if(nextHistoryState == window.rstudioHistory.length){
          window.rstudioHistory.push(url)
          nextHistoryState +=1;
        }
        else{
          window.rstudioHistory=window.rstudioHistory.slice(0,nextHistoryState)
          window.rstudioHistory.push(url)
          nextHistoryState+=1;
        }
      }
      bindHistoryNavigation($)
    }
  }
  bindHistoryNavigation = function(){
    $(".rstudio-back").unbind("click").bind("click",function(e){
      e.preventDefault();
      window.navigateBackward();
    })
    if(!(nextHistoryState>0)){
      $(".rstudio-back-arrow").css("opacity","0.5")
    }
    $(".rstudio-forward").unbind("click").bind("click",function(e){
      e.preventDefault();
      window.navigateForward();
    })
    if((nextHistoryState==window.rstudioHistory.length)){
      $(".rstudio-forward-arrow").css("opacity","0.5")
    }
  }

  window.navigateForward =function(){
    if(nextHistoryState <window.rstudioHistory.length){
      url = window.rstudioHistory[nextHistoryState]
      var base = $('base').attr('href');
      if(url.indexOf(base)>-1){
        url = url.substring(url.indexOf(base)+base.length,url.length)
      }
      window.replacePage(url, false)
      nextHistoryState +=1;
    }
  }
  window.navigateBackward=function(){
    console.log("navigating backward from "+nextHistoryState)
    if(nextHistoryState >1){
      url =window.rstudioHistory[nextHistoryState-2]
      var base = $('base').attr('href');
      if(url.indexOf(base)>-1){
        url = url.substring(url.indexOf(base)+base.length,url.length)
      }
      window.replacePage(url, false)
      nextHistoryState -=1;
    }
    else if(nextHistoryState == 1){
      historyParam=""
      window.rstudioHistory.forEach(function(state,index){
        if(index<rstudioHistory.length-1){
          historyParam += encodeURIComponent(state+",")
        }
        else{
          historyParam +=encodeURIComponent(state)
        }
      })
      if(window.location.href.indexOf("&history")>-1){
         window.location.replace(window.location.href.substring(0,window.location.href.indexOf("&history"))+"&history="+historyParam);
      }
      else{
        window.location.replace(window.location.href+"&history="+historyParam);
      }
      nextHistoryState-=1
    }
  }
})($jq);