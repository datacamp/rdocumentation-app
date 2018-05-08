(function($){

  window.Modal = {
    NUMBER_OF_SECONDS_TO_DELAY_MODAL: 5,
    DOM_ID: 'dc-modal',
    DAYS_BETWEEN_MODAL_DISPLAYS: 5,
    PROPORTION_OF_USERS_WHO_SHOULD_SEE_MODAL: 0.5,

    openWithDelay: function() {
      window.setTimeout(function() {
        $('#' + window.Modal.DOM_ID).modal({
          fadeDuration: 250,
          fadeDelay: 0.8
        });
        window.Modal.setLocalStorageExpiration();
      }, 1000 * this.NUMBER_OF_SECONDS_TO_DELAY_MODAL);
    },

    shouldRender: function() {
      var endOfNoDisplayPeriod = localStorage.getItem('modal-expiration');
      if(endOfNoDisplayPeriod) { return (new Date()).getTime() >= JSON.parse(endOfNoDisplayPeriod) }
      if(this.treatmentGroup() === 'generic') { return true }
      return false;
    },

    treatmentGroup: function() {
      var treatmentGroup = window.localStorage.getItem('modal-treatment-group-v1')
      if(treatmentGroup) { return treatmentGroup }
      return this.setAndReturnTreatmentGroup();
    },

    setAndReturnTreatmentGroup: function() {
      var treatmentGroup = Math.random() <= this.PROPORTION_OF_USERS_WHO_SHOULD_SEE_MODAL ? 'generic' : 'control';
      window.localStorage.setItem('modal-treatment-group-v1', treatmentGroup);
      return treatmentGroup;
    },

    setLocalStorageExpiration: function() {
      var currentDate = new Date();
      var dateEligibleForAnotherDisplay = currentDate.setDate(currentDate.getDate() + this.DAYS_BETWEEN_MODAL_DISPLAYS);
      localStorage.setItem('modal-expiration', dateEligibleForAnotherDisplay);
    },

    setTrackingEvents: function() {
      $('#' + this.DOM_ID).on($.modal.BEFORE_OPEN, function(event, modal) {
        window.snowplow('trackStructEvent', 'rdocs', 'modal-open', 'generic', '', '0.0');
      });

      $('#' + this.DOM_ID).on($.modal.BEFORE_CLOSE, function(event, modal) {
        window.snowplow('trackStructEvent', 'rdocs', 'modal-close', 'generic', '', '0.0');
      });
    }
  }

  if(window.Modal.shouldRender()) {
    window.Modal.setTrackingEvents();
    window.Modal.openWithDelay();
  }
})($jq);
