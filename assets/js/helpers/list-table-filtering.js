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
    $.tablesorter.addParser({
      // set a unique id
      id: 'rating',
      is: function(s) {
          // return false so this parser is not auto detected
          return false;
      },
      format: function(s) {
          // format your data for normalization
          return parseFloat(s);
      },
      // set type, either numeric or text
      type: 'numeric'
    });
    $("table.packagetable").tablesorter({
        headers: {
          2: {
              sorter:'rating'
          }
        },
        textExtraction: function (node){
          if($(node).find("i").length>0){
            var stars = $(node).find("i");
            //console.log(stars);
            var count = 0.0;
            stars.each(function(i){
              if($(this).hasClass("fa-star")){
                count += 1.0;
              }else if($(this).hasClass("fa-star-half-o")){
                count += 0.5;
              }
            });
            return ""+count;
          }
          return $(node).text();
        }
    });
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
