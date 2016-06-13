$(document).ready(function() {
  $('#packageVersionSelect').change(function(){
    window.location.href = $(this).find('option:selected').data('uri');
  });

  jQuery.expr[':'].containsRaw = function(a, i, m) {
    return jQuery(a).text().toUpperCase()
        .indexOf(m[3].toUpperCase()) >= 0;
  };


  $('#filterTopics').keyup(function () {
    var indexColumn = 0, // Search for values in the first column
    searchWords = this.value.split(" "),
    rows = $("#topics").find("tr");

    rows.hide();
    //Recusively filter the jquery object to get results.
    var filteredRows = rows.filter(function (i, v) {
      var $t = $(this).children(":eq("+indexColumn+")");
      for (var d = 0; d < searchWords.length; ++d) {
        if ($t.is(":containsRaw('" + searchWords[d].toLowerCase() + "')")) {
          return true;
        }
      }
      return false;
    });

    if(filteredRows.length === 0) {
      $('.no-results').show();
    } else {
      $('.no-results').hide();
      filteredRows.show();
    }
  });

  $('#packageVersionReview').click(function() {
    $('.package--review .popover').toggleClass('hidden');
    $('.package--review .popover textarea').focus();
  });

});
