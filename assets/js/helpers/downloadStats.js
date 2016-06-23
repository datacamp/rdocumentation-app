$(document).ready(function() {

  $('.download-task').each(function(elem) {
    var $self = $(this);
    var url = $self.data('url');
    $.get(url, function(data){
      $self.find(".total").text(data.totalStr);
      $self.find(".deps").text(data.revDepsStr);
      $('.downloads').css({'visibility': 'visible'});
    });
  });


  $('.percentile-task').each(function(elem) {
    var $self = $(this);
    var url = $self.data('url');
    $.get(url, function(data){
      $self.find(".percentile").text(''+ data.percentile + 'th');
      $('.percentile-task').css({'visibility': 'visible'});
    });
  });



});
