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

    var parseDependency = function(dependency) {
      var matches = dependency.match(/\s*([^\s(]*)(?:\s*\(\s*(<|<=|=|>=|>)\s*(.*)\s*\))?/);
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
      .concat(dependencyArrayToRecords('Enhances'))
      .concat(dependencyArrayToRecords('LinkingTo'));

    var name = descriptionJSON.Package || descriptionJSON.Bundle || 'Undefined';

    var timestamp = descriptionJSON.Date ? Date.parse(descriptionJSON.Date) : null;

    var release_date = isNaN(timestamp) ? null : new Date(timestamp);

    var authors = {contributors : []};

    if(descriptionJSON["Authors@R"] && descriptionJSON["Authors@R"].indexOf("as.person(")==-1) {
      authors = AuthorService.recoverAuthorsR(descriptionJSON);
    }
    else {
      if(descriptionJSON.Author){
        authors.contributors = AuthorService.authorsSanitizer(descriptionJSON.Author);
      }
      if(descriptionJSON.Maintainer) {
        authors.maintainer = AuthorService.authorsSanitizer(descriptionJSON.Maintainer)[0];
      }
    }


    return {
      package: {
        name: name,
      },
      fields: {
        version: descriptionJSON.Version,
        title: descriptionJSON.Title,
        release_date: release_date,
        description: descriptionJSON.Description || '',
        license: descriptionJSON.License,
        url: descriptionJSON.URL,
        copyright: descriptionJSON.Copyright
      },
      authors: authors,
      dependencies: dependencies
    };

  }


};
