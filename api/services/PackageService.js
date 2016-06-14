// PackageService.js - in api/services


var extractPersonInfo = function(person) {
  var match = person.match(Utils.emailRegex);
  if(match) {
    var personName = person
      .replace(Utils.emailRegex, '')
      .replace(/\s*\[.*?\]\s*/g, '') //remove '['cre', 'aut', ...]'
      .replace(/[^\w\s]/gi, '') // remove all special characters
      .trim(); // trim it
    return {
      name: personName,
      email: match[0].trim()
    };
  } else {
    return { name: person.replace(/[^\w\s]/gi, '').trim() };
  }
};

var authorsSanitizer = function(authorString) {
  // var authorString = "Jean Marc and Ally Son, RIP R. & Hello World!"
  var sanitized = authorString.replace('<email>', '')
                              .replace('</email>', '')
                              .replace(/\s+/g, ' ')
                              .trim();

  var separated = sanitized.split(/,|and|&|;/);

  var trimmed = separated.map(function(item) {return item.trim();});

  var mapped = trimmed.map(extractPersonInfo);

  return mapped;

};

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
    var authorArray = descriptionJSON.Author ? authorsSanitizer(descriptionJSON.Author) : [];
    var name = descriptionJSON.Package || descriptionJSON.Bundle || 'Undefined';

    return {
      package: {
        name: name,
      },
      fields: {
        version: descriptionJSON.Version,
        title: descriptionJSON.Title,
        release_date: descriptionJSON.Date ? new Date(descriptionJSON.Date) : null,
        description: descriptionJSON.Description || '',
        license: descriptionJSON.License,
        url: descriptionJSON.URL,
        copyright: descriptionJSON.Copyright
      },
      authors: authorArray,
      maintainer: descriptionJSON.Maintainer ? extractPersonInfo(descriptionJSON.Maintainer) : null,
      dependencies: dependencies
    };

  }


};
