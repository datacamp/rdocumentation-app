(function($){

  window.Modal = {
    NUMBER_OF_SECONDS_TO_DELAY_MODAL: 1,
    DOM_ID: 'dc-modal',
    DAYS_BETWEEN_MODAL_DISPLAYS: 5,

    openWithDelay: function() {
      window.setTimeout(function() {
        $('#' + window.Modal.DOM_ID).modal({
          fadeDuration: 250,
          fadeDelay: 0.8
        });
      }, 1000 * this.NUMBER_OF_SECONDS_TO_DELAY_MODAL);
    },

    shouldRender: function() {
      var endOfNoDisplayPeriod = localStorage.getItem('modal-expiration');
      return endOfNoDisplayPeriod ? (new Date()).getTime() >= JSON.parse(endOfNoDisplayPeriod) : true;
    },

    setLocalStorageExpiration: function() {
      var currentDate = new Date();
      var dateEligibleForAnotherDisplay = currentDate.setDate(currentDate.getDate() + this.DAYS_BETWEEN_MODAL_DISPLAYS);
      localStorage.setItem('modal-expiration', dateEligibleForAnotherDisplay);
    },

    setTrackingEvents: function() {
      $('#' + this.DOM_ID).on($.modal.BEFORE_OPEN, function(event, modal) {
        // TODO
      });

      $('#' + this.DOM_ID).on($.modal.BEFORE_CLOSE, function(event, modal) {
        // TODO
      });
    }
  }

  if(window.Modal.shouldRender()) {
    window.Modal.setTrackingEvents();
    window.Modal.openWithDelay();
  }
})($jq);
