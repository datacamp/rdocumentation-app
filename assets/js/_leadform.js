(function($) {
  $('.js-demo-form').on('submit', function(e) {
    e.preventDefault();
    $.ajax({
      method: "POST",
      url: "https://hooks.zapier.com/hooks/catch/2383820/wv86oo/",
      data: $('.js-demo-form').serializeArray()
    }).done(function(msg) {
      $('.js-demo-form').html("<div class='demo-form__success'><h3>Thanks!</h3><p>We'll be in touch.</p></div>");
      window.snowplow('trackStructEvent', 'form', 'submit', 'rdocs_demo_form', '', 0.0);
    });
  });

  $(document).ready(function() {
    $('.js-phone-label-question-mark').tooltip();
  })
})($jq)
