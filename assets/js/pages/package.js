$(document).ready(function() {
  $('#packageVersionSelect').change(function(){
    window.location.href = $(this).find('option:selected').data('uri');
  })
});