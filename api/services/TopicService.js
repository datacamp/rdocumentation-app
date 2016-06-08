// TopicService.js - in api/services
var _ = require('lodash'),
  cheerio = require('cheerio'),
  url = require('url');

module.exports = {


  computeLinks: function(basePath, topicInstance) {
    var toSearch = _.pick(topicInstance, ['description',
      'usage',
      'details',
      'value',
      'references',
      'note',
      'author',
      'seealso',
      'examples']
    );
    return Promise.resolve(topicInstance.package_version || topicInstance.getPackage_version()).then(function(packageVersion) {
      var replaced = _.mapValues(toSearch, function(section) {
        if (!section) return section;
        var $ = cheerio.load(section, {decodeEntities: false});
        $('a').each(function(i, elem) {
          var current = $(elem).attr('href');
          $(elem).attr('href', url.resolve(basePath, current) +
            '?package=' + packageVersion.package_name +
            '\&version=' + packageVersion.version);
        });
        console.log($);
        return $.html();
      });
      return _.assign(topicInstance, replaced);
    });

  }


};
