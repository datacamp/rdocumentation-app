(function($) {
  bootListTableFiltering = function() {

    var addExpr = function(){
      // Make :eq case insensitive
      jQuery.expr[':'].containsRaw = function(a, i, m) {
        return jQuery(a).text().toUpperCase()
            .indexOf(m[3].toUpperCase()) >= 0;
      };
    };

    $('#filter').keyup(function () {
      addExpr();
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
      addExpr();
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
    $("table").tablesorter({
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
})($jq);
