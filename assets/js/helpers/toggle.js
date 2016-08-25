(function($) {
  bootToggle = function() {
    $('[data-toggle]').click(function(event){
      event.preventDefault();
      var target = $($(this).data('target')),
      toggledText = $(this).data('toggled-text');

      $(this).data('toggled-text', $(this).text());
      $(this).text(toggledText);

      if(target.data('toggle-hidden') === true){
        target.show();
        target.data('toggle-hidden', false);
      } else {
        target.hide();
        target.data('toggle-hidden', true);
      }
    });
  };
})($jq);
