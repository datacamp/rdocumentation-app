// TopicService.js - in api/services
var _ = require('lodash'),
  cheerio = require('cheerio'),
  url = require('url');

module.exports = {

  replaceLinks: function($, packageVersion) {
    const basePath = '/link/';
    $('a').each(function(i, elem) {
      var current = $(elem).attr('href');
      var rdOptions = $(elem).attr('rd-options');
      if(!current) return;
      var absolutePattern = /^https?:\/\//i;
      if (absolutePattern.test(current)) return;
      if (rdOptions === '' || !rdOptions) {
        $(elem).attr('href', url.resolve(basePath, encodeURIComponent(current)) +
          '?package=' + encodeURIComponent(packageVersion.package_name) +
          '\&version=' + encodeURIComponent(packageVersion.version));
        $(elem).attr('data-mini-rdoc', `${packageVersion.package_name}::${current}`);
      } else {
        if (rdOptions.split(':') > 1) {
          $(elem).attr('href', url.resolve(basePath, encodeURIComponent(rdOptions[1])) +
            '?package=' + encodeURIComponent(packageVersion.package_name) +
            '\&version=' + encodeURIComponent(packageVersion.version) +
            '\&to=' + encodeURIComponent(rdOptions[0]));
            $(elem).attr('data-mini-rdoc', `${rdOptions[0]}::${rdOptions[1]}`);
        } else {
          $(elem).attr('href', url.resolve(basePath, encodeURIComponent(current)) +
            '?package=' + encodeURIComponent(packageVersion.package_name) +
            '\&version=' + encodeURIComponent(packageVersion.version) +
            '\&to=' + encodeURIComponent(rdOptions));
            $(elem).attr('data-mini-rdoc', `${rdOptions}::${current}`);
        }
      }

    });
  },

  replaceFigures: function($, packageVersion) {
    $('img').each(function(i, elem) {
      var currentSrc = $(elem).attr('src');
      if(!currentSrc) return;
      var absolutePattern = /^https?:\/\//i;
      if (absolutePattern.test(currentSrc)) return;
      $(elem).attr('src', currentSrc +
        '?package=' + encodeURIComponent(packageVersion.package_name) +
        '\&version=' + encodeURIComponent(packageVersion.version));
    })
  },

  processHrefs: function(topicInstance) {
    var topic = topicInstance.toJSON();
    var toSearch = _.pick(topic, [
      'name',
      'title',
      'description',
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
          if(!_.isString(str)) return str;

          var escapedStr = str.replace(/<-/g, '&lt;-')
                              .replace(/\n\n/g, '</p><p>');

          var $ = cheerio.load(escapedStr, { decodeEntities: false });
          TopicService.replaceLinks($, packageVersion);
          TopicService.replaceFigures($, packageVersion);
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
