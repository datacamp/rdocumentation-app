var _ = require('lodash');
var Promise = require('bluebird');

module.exports = {


  recoverPackageVersionFromSourceJSON: function() {
    var getSourceJSON = function() {
      return sequelize.query("SELECT id, sourceJSON FROM PackageVersions where sourceJSON IS not null;", { type: sequelize.QueryTypes.SELECT});
    };

    return getSourceJSON().then(function(packageVersions) {
      var total = packageVersions.length;
      return Promise.map(packageVersions, function(packageVersion, index) {
        var id = packageVersion.id;
        var sourceJSON = packageVersion.sourceJSON;

        try {
          var source = JSON.parse(sourceJSON);
          var progress = index / total * 100;
          console.log(100 - progress);

          return PackageVersion.createWithDescriptionFile({input: source})
            .catch(function(err) {
              console.log(err);
              return 0;
            });
        }
        catch(err) {
          return 0;
        }

      }, {concurrency: 1});
    });
  }
};
