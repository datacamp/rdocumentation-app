(function($) {
  var started = false;

  window.reloadPackages = function(currentFunctionPage, currentPackagePage){
    if(!isInPackageSearch(urlParam('q'))){
      $('html, body').animate({ scrollTop: 0 }, 'slow');
      $.ajax({
        url: "/search_packages?q="+urlParam('q') + "&page=" + currentPackagePage 
            + "&latest=" + searchLatestOnly(),
        crossDomain:true,
        xhrFields: {
          withCredentials: true
        }
      }).done(function(result){
        $('.packagedata').hide();
        $('.packagedata').html(result);
        $('.packagedata').fadeIn('fast');
        $('#packagetab').show();
        $('#packages').show();
        window.getPercentiles();
        window.bindFade();
        rebind(currentFunctionPage, currentPackagePage);
        $(document).trigger('content-changed');
      });
    }
    else{      
      $('.package-column').hide();
      $('#packages').hide();
      $('#packagetab').hide();
      $('.topic-column').css('width', '100%');
      $("#searchtabs").tabs("option", "active", 1);
    }
  };

  window.reloadFunctions = function(currentFunctionPage, currentPackagePage){
    $('html, body').animate({ scrollTop: 0 }, 'slow');
    var query = urlParam('q');
    var packageParam = "";
    if(isInPackageSearch(urlParam('q'))){
      var packageAndFunction = splitInPackageAndFunction(urlParam('q'));
      packageParam = "&package=" + packageAndFunction[0];
      query = packageAndFunction[1];
    }
  	$.ajax({
  		url: "/search_functions?q="+ query + packageParam + "&page=" 
          + currentFunctionPage + "&latest=" + searchLatestOnly(),
    	crossDomain:true,
      xhrFields: {
        withCredentials: true
      }
  	}).done(function(result){
      $('.functiondata').hide();
  		$('.functiondata').html(result);
      $('.functiondata').fadeIn('fast');
      window.bindFade();
      rebind(currentFunctionPage, currentPackagePage);
      $(document).trigger('content-changed');
  	});
  };

  window.rebind = function(currentFunctionPage, currentPackagePage) {
    if (currentFunctionPage <= 1) {
      $('.prec-function-page').hide();
    }
    $('.prec-function-page').unbind().click(function() {
      var newPage = currentFunctionPage - 1;
      updateHistory(newPage, currentPackagePage);
      reloadFunctions(newPage, currentPackagePage);
    });

    $('.next-function-page').unbind().click(function() {
      var newPage = currentFunctionPage + 1;
      updateHistory(newPage, currentPackagePage);
      reloadFunctions(newPage, currentPackagePage);
    });

    if (currentPackagePage <= 1) {
      $('.prec-package-page').hide();
    }
    $('.prec-package-page').unbind().click(function() {
       var newPage = currentPackagePage - 1;
      updateHistory(currentFunctionPage, newPage);
      reloadPackages(currentFunctionPage, newPage);
    });


    $('.next-package-page').unbind().click(function() {
      var newPage = currentPackagePage + 1;
      updateHistory(currentFunctionPage, newPage);
      reloadPackages(currentFunctionPage, newPage);
    });
  };

  window.updateHistory = function(newFunctionPage, newPackagePage) {
    var url = window.location.protocol+ "//" +
      window.location.host +
      window.location.pathname +
      '?q=' + urlParam('q') +
      '&latest=' + searchLatestOnly();

    if(newPackagePage !== undefined && newFunctionPage !== undefined)
      url += '&packagePage=' + newPackagePage +
      '&functionPage=' + newFunctionPage;
     history.pushState({packagePage: newPackagePage, functionPage: newFunctionPage}, jQuery(document).find('title').text(), url);
  };

  window.launchFullSearch = function() {
    if(getCurrentPath().indexOf('search')==0) { // check if we're on the right page
      if(!started){
        $("#older").prop( "checked", (urlParam('latest') === "0") ? true : false);
        $('#hidden_latest').val(searchLatestOnly);
        started = true;
      }
      var currentPage = parseInt(urlParam("page")) || 1;
      var currentPackagePage = parseInt(urlParam("packagePage")) || currentPage;
      var currentFunctionPage = parseInt(urlParam("functionPage")) || currentPage;
      $("#searchbar").val(decodeURIComponent(urlParam('q')));
      window.activateTabs("#searchtabs");
      reloadPackages(currentFunctionPage, currentPackagePage);
      reloadFunctions(currentFunctionPage, currentPackagePage);
      window.onpopstate = function(event) {
        reloadPackages(event.state.functionPage, event.state.packagePage);
        reloadFunctions(event.state.functionPage, event.state.packagePage);
      };
    }
  };

  $('#older').change(function() {
    if(started){      
      $('#hidden_latest').val(searchLatestOnly);
      updateHistory();
      launchFullSearch();
    }
  });

  var searchLatestOnly = function(){
    return ($('#older').is(':checked')) ? 0 : 1;
  }

  var isInPackageSearch = function(query){
    return splitInPackageAndFunction(query).length == 2;
  }

  var splitInPackageAndFunction = function(query){
    return decodeURIComponent(query).split("::");
  }

})($jq);
