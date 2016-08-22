$(function() {
  if(urlParam('viewer_pane') === '1' && !window.rstudioHistory){
    if(typeof(getUrlVars()["history"])=="undefined"){
      window.rstudioHistory = [];
      window.nextHistoryState = 0;
    }
    else{
      window.rstudioHistory=decodeURIComponent(getUrlVars()["history"]).split(",")
      window.nextHistoryState = 0;
    }
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
      else if(window.nextHistoryState == 1){
        historyParam=""
        window.rstudioHistory.forEach(function(state,index){
          if(index<rstudioHistory.length-1){
            historyParam += encodeURIComponent(state+",")
          }
          else{
            historyParam +=encodeURIComponent(state)
          }
        })
        window.location.replace(window.location.href+"&history="+historyParam);
        window.nextHistoryState-=1
      }
    }
    window.bindHistoryNavigation = function(){
      $(".rstudio-back").bind("click",function(e){
        e.preventDefault();
        window.navigateBackward();
      })
      if(!(window.nextHistoryState>0)){
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