window.getPercentiles = function() {
  $('.percentile-task').each(function(elem) {
    var $self = $(this);
    var url = $self.data('url');
    $.get(url, function(data){
      if(data.percentile != null){
      $self.find(".percentile").text(''+ data.percentile + 'th');
      $self.css({'visibility': 'visible'});
    } else{
      $self.css({'display': 'none'});
    }
    });
  });
};

$(document).ready(function() {

  window.getPercentiles();
  downloadTask();

  $('.js-rating-download').each(function(elem) {
    var $self = $(this);
    var url = $self.data('url');
    $.get(url, function(data){
      var rounded = Math.round(data.rating*2)/2,
          leftOver = rounded % 1,
          index;

      for (index = 0; index < rounded; index++) {
        $self.find('.fa-star-o:nth-child(' + index + ')').removeClass('fa-star-o').addClass('fa-star');
      }
      if(leftOver == 0.5) {
        $self.find('.fa-star-o:nth-child(' + index + ')').removeClass('fa-star-o').addClass('fa-star-half-o');
      }
      $self.text();
    });
  });

});

downloadTask = function(){
  $('.download-task').each(function(elem) {
    var $self = $(this);
    var url = $self.data('url');
    $.get(url, function(data){
      $self.find(".total").text(data.totalStr);
      $self.find(".deps").text(data.indirectDownloadsStr);
      $self.find(".indeps").text(data.directDownloadsStr);
      $(".fa-info-circle").attr("title","Monthly downloads are direct downloads. The package also had " + data.indirectDownloadsStr + " dependent downloads for a total of " + data.totalStr +".");
      $(".fa-info-circle").tooltip({
        placement: 'bottom'
      });
      $('.downloads').css({'visibility': 'visible'});
    });
  });
};
