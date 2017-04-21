// PackageService.js - in api/services
const _ = require('lodash');
const Promise = require('bluebird');
const request = require('superagent');


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

    var date = descriptionJSON['Date/Publication'] || descriptionJSON.Date;

    var timestamp = date ? Date.parse(date) : null;

    var release_date = isNaN(timestamp) ? new Date() : new Date(timestamp);

    var authors = {contributors : []};

    if(descriptionJSON.jsonAuthors) {
      console.log(descriptionJSON.jsonAuthors);
      var partition = _.partition(descriptionJSON.jsonAuthors, function(a) { return a.maintainer });
      authors.maintainer = partition[0][0];
      authors.contributors = partition[1];
      console.log(authors);
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

  },

  isDCLSupported: function(package, version) {
    return RedisService.getJSONFromCache("default_r_packages", null, RedisService.WEEKLY, function() {
      return new Promise(function(resolve, reject) {
        return request.get('http://documents.datacamp.com/default_r_packages.txt').end(function(err, res) {
          if(err) return reject(err);
          return resolve({ text: res.text });
        })
      })
    })
    .then(function(res) {
      var regex = new RegExp(_.escapeRegExp(package)+'\\s*'+_.escapeRegExp(version))
      return regex.test(res.text);
    }).catch(function() {
      return false;
    });
  },

  compareVersions: function(order, property) {
    const lower = order === 'asc' ? -1 : 1;
    const higher = order === 'asc' ? 1 : -1;
     return function (v1, v2) {
      if (_.isFunction(property)) {
        v1 = property(v1);
        v2 = property(v2);
      } else if (property){
        v1 = v1[property];
        v2 = v2[property];
      }
      const v1Components = v1.replace('-', '.').split('.');
      const v2Components = v2.replace('-', '.').split('.');
      let currentV1 = null;
      let currentV2 = null;
      while (true) { //only case where it continue is actually currentV1 === currentV2
        currentV1 = v1Components.shift();
        currentV2 = v2Components.shift();
        let compareValue
        if (currentV1 === undefined && currentV2 === undefined) return 0;
        if (currentV1 === undefined && currentV2 !== undefined) return lower;
        if (currentV1 !== undefined && currentV2 === undefined) return higher;
        compareValue = currentV1.localeCompare(currentV2, [], { numeric: true });
        if (compareValue !== 0) return compareValue < 0 ? lower : higher;
      }
    }
  }


};
