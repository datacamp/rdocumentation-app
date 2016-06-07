// PackageService.js - in api/services
module.exports = {

  /**

  {
    "Package": "ACA",
    "Type": "Package",
    "Title": "Abrupt Change-Point or Aberration Detection in Point Series",
    "Version": "1.0",
    "Date": "2016-03-08",
    "Author": "Daniel Amorese",
    "Maintainer": "Daniel Amorese  <amorese@ipgp.fr>",
    "Depends": "R (>= 3.2.2)",
    "Imports": "graphics, grDevices, stats, utils",
    "Description": "Offers an interactive function for the detection of breakpoints in series.",
    "License": "GPL",
    "LazyLoad": "yes",
    "NeedsCompilation": "no",
    "Packaged": "2016-03-10 07:32:56 UTC; daniel",
    "Repository": "CRAN",
    "Date/Publication": "2016-03-10 17:55:15"
  }

  */
  mapDescriptionToPackageVersion: function(descriptionJSON) {
    var extractPersonInfo = function(infos) {
      var delimiters = [
        {begin: '<email>', end: '</email>'},
        {begin: '<', end: '>'},
        {begin: '\\(', end: '\\)'}
      ];
      var authorObject = {};
      for (var i in delimiters) {
        var delimiter = delimiters[i];
        var regex = new RegExp(delimiter.begin + '(.*)' + delimiter.end);
        var emailMatch = infos.match(regex);
        if (emailMatch !== null) {
          authorObject.name = infos.replace(regex, '').trim();
          authorObject.email = emailMatch[1].trim();
          break;
        }
      }
      if (authorObject.email) { //email found
        return authorObject;
      } else { //no email found
        return {name: infos.trim()};
      }
    };

    var parseDependency = function(dependency) {
      var matches = dependency.match(/\s*(\w*)(?:\s*\(\s*(<|<=|=|>=|>)\s*(.*)\s*\))?/);
      return {
        package: matches[1],
        comparator: matches[2] || null,
        version: matches[3] || null
      };
    };

    var dependencyArrayToRecords = function(type) {
      if (!descriptionJSON[type]) return [];
      return descriptionJSON[type].split(',').map(function(dependency) {
        var dependencyObject = parseDependency(dependency);
        return {
          dependency_name: dependencyObject.package,
          type: type.toLowerCase(),
          dependency_version: dependencyObject.version,
          version_comparator: dependencyObject.comparator
        };
      });
    };

    var dependencies = dependencyArrayToRecords('Depends')
      .concat(dependencyArrayToRecords('Imports'))
      .concat(dependencyArrayToRecords('Suggests'))
      .concat(dependencyArrayToRecords('Enhances'));
    var authorArray = descriptionJSON.Author ? descriptionJSON.Author.split(',') : [];

    return {
      package: {
        name: descriptionJSON.Package,
      },
      fields: {
        version: descriptionJSON.Version,
        title: descriptionJSON.Title,
        release_date: new Date(descriptionJSON.Date),
        description: descriptionJSON.Description,
        license: descriptionJSON.License,
        url: descriptionJSON.URL,
        copyright: descriptionJSON.Copyright
      },
      authors: authorArray.map(extractPersonInfo),
      maintainer:  extractPersonInfo(descriptionJSON.Maintainer),
      dependencies: dependencies
    };

  }


};
