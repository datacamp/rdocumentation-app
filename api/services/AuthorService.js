var _ = require('lodash');
var Promise = require('bluebird');

module.exports = {

  aggregateAuthors: function() {
    var getDuplicatesAuthors = function () {
      return sequelize.query("SELECT DISTINCT name FROM Collaborators where name in (SELECT name FROM (select name, count(*) as sum from Collaborators group by name order by sum desc) s where s.sum > 1) AND email is null order by name;", { type: sequelize.QueryTypes.SELECT});
    };

    return getDuplicatesAuthors().then(function(names) {
      return Promise.map(names, function(nameInstance) {
        var name = nameInstance.name;
        return Collaborator.findAll({
          where: {name: name},
          order: [['email', 'DESC']],
          include: [{
            model: PackageVersion,
            as: 'authored_packages',
            attributes: ['id']
          }]
        }).then(function(collaborators) {
          var stays = collaborators[0];
          var others = collaborators.slice(1);
          var authored = _.reduce(others, function(acc, collaborator) {
            return acc.concat(collaborator.authored_packages);
          }, []);

          var associate = stays.addAuthored_packages(authored);

          var remove = Promise.map(others, function(other) {
            return other.destroy();
          });

          return Promise.join(associate, remove, function(result, removeResult) {
            console.info("done: "+ name);
            return {name: name, result: 'success'};
          });
        });

      });
    });

  },

  recoverMaintainer: function() {
    var getSourceJSON = function() {
      return sequelize.query("SELECT id, sourceJSON FROM PackageVersions where sourceJSON IS not null AND maintainer_id is null;", { type: sequelize.QueryTypes.SELECT});
    };

    return getSourceJSON().then(function(packageVersions) {
      return Promise.map(packageVersions, function(packageVersion) {
        var id = packageVersion.id;
        var sourceJSON = packageVersion.sourceJSON;
        var source = JSON.parse(sourceJSON);

        var maintainer = source.Maintainer;
        if (!maintainer) return { id: id, result: 'success'}; //nothing to do;
        var sanitized = AuthorService.authorsSanitizer(maintainer)[0];

        return Collaborator.insertAuthor(sanitized).then(function(maintainerInstance) {
          return PackageVersion.update({maintainer_id: maintainerInstance.id}, {
            where: {id: id},
            fields: ['maintainer_id']
          }).then(function(affecteds) {
            console.log("done: " + id);
            return { id: id, result: 'success'};
          });
        }).catch(function(err) {
          console.log("fail: " + id);
          console.log(err);
          return { id: id, result: 'error', message: err.toString()};
        });


      }, {concurrency: 5});
    });
  },



  extractPersonInfo: function(person) {
    var match = person.match(Utils.emailRegex);
    if(match) {
      var personName = person
        .replace(Utils.emailRegex, '')
        .replace(/[^\w\s]/gi, '') // remove all special characters
        .replace(/(?: (aut|com|ctb|cph|cre|ctr|dtc|ths|trl)$)|(?:^(aut|com|ctb|cph|cre|ctr|dtc|ths|trl)(?= ))|(?: (aut|com|ctb|cph|cre|ctr|dtc|ths|trl)(?= ))/g, '')
        .trim(); // trim it
      return {
        name: personName,
        email: match[0].trim()
      };
    } else {
      return { name: person.replace(/[^\w\s]/gi, '').trim() };
    }
  },

  authorsSanitizer: function(authorString) {
    // var authorString = "Jean Marc and Ally Son, RIP R. & Hello World!"
    var sanitized = authorString.replace('<email>', '')
                                .replace('</email>', '')
                                .replace(/\s+/g, ' ')
                                .trim();

    var separated = sanitized.split(/,|and|&|;/);

    var trimmed = separated.map(function(item) {return item.trim();});

    var mapped = trimmed.map(AuthorService.extractPersonInfo);

    return mapped;

  }

};
