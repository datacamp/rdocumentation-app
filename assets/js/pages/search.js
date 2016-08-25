(function($) {
  window.reloadPackages = function(currentFunctionPage, currentPackagePage){
    $('html, body').animate({ scrollTop: 0 }, 'slow');
  	$.ajax({
  		url: "/search_packages?q="+urlParam('q') + "&page=" + currentPackagePage,
      crossDomain:true,
      xhrFields: {
        withCredentials: true
      }
  	}).done(function(result){
      $('.packagedata').hide();
      $('.packagedata').html(result);
      $('.packagedata').fadeIn('fast');
      if(urlParam('viewer_pane') === '1'){
        window.bindGlobalClickHandler();
      }
      window.getPercentiles();
      window.bindFade();
      rebind(currentFunctionPage, currentPackagePage);
  	});
  };

  window.reloadFunctions = function(currentFunctionPage, currentPackagePage){
    $('html, body').animate({ scrollTop: 0 }, 'slow');
  	$.ajax({
  		url: "/search_functions?q="+ urlParam('q') + "&page=" + currentFunctionPage,
    	crossDomain:true,
      xhrFields: {
        withCredentials: true
      }
  	}).done(function(result){
      $('.functiondata').hide();
  		$('.functiondata').html(result);
      $('.functiondata').fadeIn('fast');
      if(urlParam('viewer_pane') === '1'){
        window.bindGlobalClickHandler();
      }
      rebind(currentFunctionPage, currentPackagePage);
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
     '&packagePage=' + newPackagePage +
     '&functionPage=' + newFunctionPage;
     history.pushState({packagePage: newPackagePage, functionPage: newFunctionPage}, jQuery(document).find('title').text(), url);
  };

  window.launchFullSearch = function() {
    if(getCurrentPath().indexOf('search')==0) { // check if we're on the right page
      var currentPage = parseInt(urlParam("page")) || 1;
      var currentPackagePage = parseInt(urlParam("packagePage")) || currentPage;
      var currentFunctionPage = parseInt(urlParam("functionPage")) || currentPage;
      $("#searchbar").val(urlParam('q'));
      window.activateTabs("#searchtabs");
      reloadPackages(currentFunctionPage, currentPackagePage);
      reloadFunctions(currentFunctionPage, currentPackagePage);
      window.onpopstate = function(event) {
        reloadPackages(event.state.functionPage, event.state.packagePage);
        reloadFunctions(event.state.functionPage, event.state.packagePage);
      };
    }
  };

})($jq);
