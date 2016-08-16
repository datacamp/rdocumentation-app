function reloadPackages(currentFunctionPage, currentPackagePage){
  $('html, body').animate({ scrollTop: 0 }, 'slow');
	$.ajax({
		url: "/search_packages?"+window.location.href.slice(window.location.href.indexOf('?') + 1)+ "&page=" + currentPackagePage,
	}).done(function(result){
    $('.packagedata').html(result);
    window.getPercentiles();
    rebind(currentFunctionPage, currentPackagePage);
	});
}

function reloadFunctions(currentFunctionPage, currentPackagePage){
  $('html, body').animate({ scrollTop: 0 }, 'slow');
	$.ajax({
		url: "/api/searchfunctions?"+window.location.href.slice(window.location.href.indexOf('?') + 1)+ "&page=" + currentFunctionPage,
  		context: document.body
	}).done(function(result){
		$('.functiondata').html(result);
    rebind(currentFunctionPage, currentPackagePage);
	});
}

function rebind(currentFunctionPage, currentPackagePage) {
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
}

function updateHistory(newFunctionPage, newPackagePage) {
  var url = window.location.protocol+ "//" +
   window.location.host +
   window.location.pathname +
   '?q=' + urlParam('q') +
   '&packagePage=' + newPackagePage +
   '&functionPage=' + newFunctionPage;
   history.pushState({packagePage: newPackagePage, functionPage: newFunctionPage}, jQuery(document).find('title').text(), url);
}

window.launchFullSearch = function() {
  if(getPath() === 'search') {
    var currentPage = parseInt(urlParam("page")) || 1;
    var currentPackagePage = parseInt(urlParam("packagePage")) || currentPage;
    var currentFunctionPage = parseInt(urlParam("functionPage")) || currentPage;
    $("#searchbar").val(urlParam('q'));
    reloadPackages(currentFunctionPage, currentPackagePage);
    reloadFunctions(currentFunctionPage, currentPackagePage);
    $("#searchtabs").tabs();
    window.onpopstate = function(event) {
      reloadPackages(event.state.functionPage, event.state.packagePage);
      reloadFunctions(event.state.functionPage, event.state.packagePage);
    };
  }
};

