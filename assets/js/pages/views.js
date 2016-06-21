$(document).ready(function() {
  $( ".display-list" ).click(function(e) {
    e.preventDefault();
    $(this).parent().find(".view-package-list").toggle();
  });
});
