// TopicService.js - in api/services
var _ = require('lodash'),
  cheerio = require('cheerio'),
  url = require('url');

module.exports = {


  computeLinks: function(basePath, topicInstance) {
    var topic = topicInstance.toJSON();
    var toSearch = _.pick(topic, ['description',
      'usage',
      'details',
      'value',
      'references',
      'note',
      'author',
      'seealso',
      'arguments',
      'sections']
    );
    return Promise.resolve(topicInstance.package_version || topicInstance.getPackage_version()).then(function(packageVersion) {
      var replaced = _.mapValues(toSearch, function(section) {
        var replaceLinks = function (str) {
          if(str === null) return null;
          var $ = cheerio.load(str, {decodeEntities: false});
          $('a').each(function(i, elem) {
            var current = $(elem).attr('href');
            var rdOptions = $(elem).attr('rd-options');
            if(!current) return;
            if (rdOptions === '' || !rdOptions) {
              $(elem).attr('href', url.resolve(basePath, encodeURIComponent(current)) +
                '?package=' + encodeURIComponent(packageVersion.package_name) +
                '\&version=' + encodeURIComponent(packageVersion.version));
            } else {
              if (rdOptions.split(':') > 1) {
                $(elem).attr('href', url.resolve(basePath, encodeURIComponent(rdOptions[1])) +
                  '?package=' + encodeURIComponent(packageVersion.package_name) +
                  '\&version=' + encodeURIComponent(packageVersion.version) +
                  '\&to=' + encodeURIComponent(rdOptions[0]));
              } else {
                $(elem).attr('href', url.resolve(basePath, encodeURIComponent(current)) +
                  '?package=' + encodeURIComponent(packageVersion.package_name) +
                  '\&version=' + encodeURIComponent(packageVersion.version) +
                  '\&to=' + encodeURIComponent(rdOptions));
              }
            }

          });
          return $.html();
        };
        if (!section) return section;
        if (section instanceof Array) {
          var x = section.map(function(val) {
            return _.mapValues(val, replaceLinks);
          });
          return x;
        }
        else return replaceLinks(section);
      });
      return _.assign(topic, replaced);
    });

  }




};
