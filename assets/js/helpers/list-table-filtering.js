$(document).ready(function() {


  $('#filter').keyup(function () {
    var indexColumn = 0, // Search for values in the first column
    searchWords = this.value.split(" "),
    rows = $("#filterableItems").find("tr").not(".no-results");

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
  $('#packagefilter').keyup(function () {
    var indexColumn = 1, // Search for values in the second  column
    searchWords = this.value.split(" "),
    rows = $("#filterableItems").find("tr").not(".no-results");

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

});
