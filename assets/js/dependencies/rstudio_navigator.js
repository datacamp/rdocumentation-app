$(function() {
  if(urlParam('viewer_pane') === '1' && !window.rstudioHistory){
    window.rstudioHistory = [];
    window.nextHistoryState = 0;
    window.pushHistory = function(url){
      if(window.nextHistoryState == window.rstudioHistory.length){
        window.rstudioHistory.push(url)
        window.nextHistoryState +=1;
      }
      else{
        window.rstudioHistory=window.rstudioHistory.slice(0,window.nextHistoryState)
        window.rstudioHistory.push(url)
        window.nextHistoryState+=1;
      }
    }

    window.navigateForward =function(){
      if(window.nextHistoryState <window.rstudioHistory.length){
        url = window.rstudioHistory[window.nextHistoryState]
        var base = $('base').attr('href');
        if(url.indexOf(base)>-1){
          url = url.substring(url.indexOf(base)+base.length,url.length)
        }
        window.replacePage(url,true,false)
        window.nextHistoryState +=1;
      }
    }
    window.navigateBackward=function(){
      if(window.nextHistoryState >1){
        url =window.rstudioHistory[window.nextHistoryState-2]
        var base = $('base').attr('href');
        if(url.indexOf(base)>-1){
          url = url.substring(url.indexOf(base)+base.length,url.length)
        }
        window.replacePage(url,true,false)
        window.nextHistoryState -=1;
      }
    }
    window.bindHistoryNavigation = function(){
      $(".rstudio-back").bind("click",function(e){
        e.preventDefault();
        window.navigateBackward();
      })
      if(!(window.nextHistoryState>1)){
        $(".rstudio-back-arrow").css("opacity","0.5")
      }
      $(".rstudio-forward").bind("click",function(e){
        e.preventDefault();
        window.navigateForward();
      })
      if((window.nextHistoryState==window.rstudioHistory.length)){
        $(".rstudio-forward-arrow").css("opacity","0.5")
      }
    }
    window.bindHistoryNavigation();
  }      
})