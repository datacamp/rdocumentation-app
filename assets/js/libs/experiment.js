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
      var total = 0;
      var weights = [];
      for(i = 0; i < this.variants.length; i++) {
        total += this.variants[i].weight;
        weights[i] = total;
      }
      var random = Math.random() * weights[weights.length - 1];
      selectedVariantIndex = weights.findIndex(function(weight) {
        return random < weight;
      });
      var selectedVariant = this.variants[selectedVariantIndex];
      this.variant = selectedVariant;
      window.localStorage.setItem(this.EXPERIMENT_NAME, selectedVariant.name);
      this.sendSnowplowTrackingEvent();
      return selectedVariant.name;
    }

    this.sendSnowplowTrackingEvent = function() {
      // Snowplow requires variant weights to be integers, so let's 10x them until they are.
      while(this.variants.some(function(variant) { return variant.weight % 1 !== 0 })) {
        this.variants.forEach(function(variant) { variant.weight *= 10 })
      }

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
