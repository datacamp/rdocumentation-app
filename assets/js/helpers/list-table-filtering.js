(function($) {

  var addExpr = function(){
    // Make :eq case insensitive
    $.expr[':'].containsRaw = function(a, i, m) {
      return $(a).text().toUpperCase()
          .indexOf(m[3].toUpperCase()) >= 0;
    };
  };

  function filterFunction(index) {
    return function () {
      addExpr();
      var indexColumn = index, // Search for values in the first column
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
    };
  }

  window.tableSort = function() {
    $("table.packagetable").tablesorter();
  };

  window.bindFilter = function() {
    $('#filter').keyup(filterFunction(0));
    $('#packagefilter').keyup(filterFunction(1));
  };

  window.bootListTableFiltering = function() {
    window.bindFilter();
    window.tableSort();
  };
})($jq);
