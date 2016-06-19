window.packageVersionToggleHandler = function() {
  $('#packageVersionSelect').change(function(){
    var url = $(this).find('option:selected').data('uri');
    if(urlParam('viewer_pane') === '1'){
      window.replacePage(url);
    } else {
      window.location.href = url;
    }
  });

  // Make :eq case insensitive
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

  var downloadStatsUrl = $('#totalDownloads').data('url');
  $.get(downloadStatsUrl, function(data){
    $('#totalDownloads').text(data.totalStr);
    $('#indDownloads').text(data.revDepsStr);
    $('.package--downloads').css({'visibility': 'visible'});
  });

}

$(document).ready(window.packageVersionToggleHandler);
