(function(){
  window.Experiment = function(experimentName, experimentClass) {
    this.EXPERIMENT_NAME = experimentName;
    this.variants = [];
    this.experimentClass = experimentClass;

    this.addVariant = function(name, weight) {
      this.variants.push({
        experiment_name: this.EXPERIMENT_NAME,
        name: name,
        weight: weight
      })
    }

    this.chooseVariant = function() {
      var savedVariant = window.localStorage.getItem(this.EXPERIMENT_NAME);
      if(savedVariant) { return savedVariant }

      // Use a CDF to select a variant based on weight.
      var total = this.variants.reduce(function(total, variant) {
        return total + variant.weight;
      }, 0);
      var random = Math.floor(Math.random() * (total + 1));
      var selectedVariant = this.variants.find(function(variant) {
        random -= variant.weight;
        return random <= 0;
      });
      this.variant = selectedVariant;
      window.localStorage.setItem(this.EXPERIMENT_NAME, selectedVariant.name);
      this.sendSnowplowTrackingEvent();
      return selectedVariant.name;
    }

    this.sendSnowplowTrackingEvent = function() {
      window.snowplow('trackSelfDescribingEvent', {
        schema: 'iglu:com.datacamp/experiment/jsonschema/1-0-0',
        data: {
          name: this.EXPERIMENT_NAME,
          status: 'start',
          alternative: this.variant,
          alternatives: this.variants,
        }
      });
    }

    this.execute = function() {
      this.experimentClass.execute(this.chooseVariant());
    }
  }
})();
