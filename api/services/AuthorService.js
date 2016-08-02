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
            as: 'authored_packages'
          },
          {
            model: PackageVersion,
            as: 'maintained_packages',
            separate: true
          }],
        }).then(function(collaborators) {
          var stays = collaborators[0];
          var others = collaborators.slice(1);
          var authored = _.uniq(_.reduce(others, function(acc, collaborator) {
            return acc.concat(collaborator.authored_packages.map(function(p) {return p.id;}));
          }, []));
          var maintained = _.uniq(_.reduce(others, function(acc, collaborator) {
            return acc.concat(collaborator.maintained_packages.map(function(p) {return p.id;}));
          }, []));

          return stays.addAuthored_packages(authored).then(function(associations) {
            return PackageVersion.update({
              maintainer_id: stays.id
            }, {
              where: { id: { $in: maintained } }
            }).then(function(updated) {
              return Collaborator.destroy({
                where: {id: {$in: others.map(function(o) {return o.id;})}}
              }).then(function() {
                console.info("done: "+ name);
                return {name: name, result: 'success'};
              });
            });

          });

        });

      }, {concurrency:5});
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
    var match = person.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i);
    var personJSON = {};
    if(match) {
      person = person.replace(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i
        , '').replace(/</,'').replace(/>/,'');
      personJSON.email = match[0].trim();
    }
    if(person.indexOf("\"")!==-1){
      person = person.split("\"")[1];
    }

    //console.log(person);
    if(person.match(/(\s*([A-Z][^\s,&]*)\s*)+/i)){
      personJSON.name = person.match(/(\s*([A-Z][^\s,&]*)\s*)+/i)[0].trim();

      if(personJSON.name[personJSON.name.length-1]=='.') {
        personJSON.name = personJSON.name.slice(0,personJSON.name.length-1);
      }

      var splittedName = personJSON.name.split(" ");
      if(splittedName.length > 2) {
        var middleName = splittedName[1];
        splittedName.splice(1, 1);
        var newName = splittedName.join(' ');
        personJSON.name = newName;
      }

    } else {
      personJSON = undefined;
    }

    return personJSON;

  },

  authorsSanitizer: function(authorString) {
    var sanitized = authorString.replace('<email>', '')
                                .replace('</email>', '')
                                .replace(/\[.*?\]/g,'')
                                .replace(/\(.*?\)/g,'')
                                .replace(/\n\s*/g,' ')
                                .replace('\t',' ')
                                .replace(/with.*$/g,'')
                                .replace(/based on.*$/g,'')
                                .replace(/assistance.*$/g,'')
                                .replace(/derived from.*$/g,'')
                                .replace(/uses.*$/g,'')
                                .replace(/as represented by.*$/g,'')
                                .replace(/contributions.*$/g,'')
                                .replace(/under.*$/g,'')
                                .replace(/and others.*$/g,'')
                                .replace(/and many others.*$/g,'')
                                .replace(/and authors.*$/g,'')
                                .replace(/assisted.*$/g,'')
                                .trim();

    var separated = sanitized.split(/,\s*and|,|\sand|&|;/);



    var trimmed = separated.map(function(item) {return item.trim();});

    var mapped = trimmed.map(AuthorService.extractPersonInfo);

    var filtered = mapped.filter(function(item){if(item == undefined){return false;} return true;});

    return filtered;

  },

  recoverAuthorsR: function(json){
    if(json["Authors@R"].indexOf("as.person(")!==-1){
      return AuthorService.authorsSanitizer(json["Authors@R"]);
    }

    var person = json["Authors@R"].split("person(");
    person.shift();
    var hasMaintainer = false;
    var result = {
      contributors : []
    };

    person.forEach(function(str){
      var list = str.split(",");
      var name = "", middle ="", family = "", email, isMaintainer = false;
      var fullName;

      list.forEach(function(piece){
        if(piece.indexOf("email")>=0) {
          email = piece.split("\"")[1];
        }
        if(piece.indexOf("cre")>=0&&!hasMaintainer) {
          isMaintainer=true;
          hasMaintainer=true;
        }
      });

      name = list[0].split("\"")[1];

      if(list[0].indexOf("c(")!==-1) {
        middle = list[1].split("\"")[1];
        family = list[2].split("\"")[1];
        fullName = name +" "+ middle + " "+family;
      }
      else {
        family = list[1].split("\"")[1];
        fullName = name+" "+family;
      }
      var author = {};
      author.name = fullName;

      if(email) {
        author.email = email;
      }

      result.contributors.push(author);

      if(isMaintainer) {
        result.maintainer = author;
      }
    });
    return result;
  },


  parseAllAuthors: function() {
    return PackageVersion.getAllVersions().then(function(Results) {
      return Promise.mapSeries(Results, function(Result) {

        if(Result.sourceJSON) {
          var json = JSON.parse(Result.sourceJSON);
          var auth = {contributors : []};
          if(json["Authors@R"] && json["Authors@R"].indexOf("as.person(")==-1) {
            auth = AuthorService.recoverAuthorsR(json);
          }
          else {
            if(json.Author){
              auth.contributors = AuthorService.authorsSanitizer(json.Author);
            }
            if(json.Maintainer) {
              auth.maintainer = AuthorService.authorsSanitizer(json.Maintainer)[0];

            }
          }

          return Collaborator.insertAllAuthors(auth, Result);
        } else return;

      });
    });
  }
};
