(function($){

  window.Modal = {
    NUMBER_OF_SECONDS_TO_DELAY_MODAL: 5,
    DOM_IDENTIFIER: '.js-dc-modal',
    DAYS_BETWEEN_MODAL_DISPLAYS: 5,

    execute: function(variant) {
      if(variant === 'generic' && window.Modal.shouldRender()) {
        window.Modal.setTrackingEvents();
        window.Modal.openWithDelay();
      }
    },

    openWithDelay: function() {
      window.setTimeout(function() {
        $(window.Modal.DOM_IDENTIFIER).modal({
          fadeDuration: 250,
          fadeDelay: 0.8
        });
        window.Modal.setLocalStorageExpiration();
      }, 1000 * this.NUMBER_OF_SECONDS_TO_DELAY_MODAL);
    },

    shouldRender: function() {
      var endOfNoDisplayPeriod = localStorage.getItem('modal-expiration');
      if(endOfNoDisplayPeriod) {
        return (new Date()).getTime() >= JSON.parse(endOfNoDisplayPeriod)
      }
      return true;
    },

    setLocalStorageExpiration: function() {
      var currentDate = new Date();
      var dateEligibleForAnotherDisplay = currentDate.setDate(currentDate.getDate() + this.DAYS_BETWEEN_MODAL_DISPLAYS);
      localStorage.setItem('modal-expiration', dateEligibleForAnotherDisplay);
    },

    setTrackingEvents: function() {
      $(this.DOM_IDENTIFIER).on($.modal.BEFORE_OPEN, function(event, modal) {
        window.snowplow('trackStructEvent', 'rdocs', 'modal-open', 'generic', '', '0.0');
      });

      $(this.DOM_IDENTIFIER).on($.modal.BEFORE_CLOSE, function(event, modal) {
        window.snowplow('trackStructEvent', 'rdocs', 'modal-close', 'generic', '', '0.0');
      });
    }
  }
})($jq);
