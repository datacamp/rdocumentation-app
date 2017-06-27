(function($) {
  window.reloadPackages = function(currentFunctionPage, currentPackagePage){
    if(!isInPackageSearch(urlParam('q'))){
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
        window.getPercentiles();
        window.bindFade();
        rebind(currentFunctionPage, currentPackagePage);
        $(document).trigger('content-changed');
      });
    }
    else{
      $('.packagedata').hide();
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
  		url: "/search_functions?q="+ query + packageParam + "&page=" + currentFunctionPage,
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
     '&packagePage=' + newPackagePage +
     '&functionPage=' + newFunctionPage;
     history.pushState({packagePage: newPackagePage, functionPage: newFunctionPage}, jQuery(document).find('title').text(), url);
  };

  window.launchFullSearch = function() {
    if(getCurrentPath().indexOf('search')==0) { // check if we're on the right page
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

  isInPackageSearch = function(query){
    return splitInPackageAndFunction(query).length == 2;
  }

  splitInPackageAndFunction = function(query){
    return decodeURIComponent(query).split("::");
  }

})($jq);
