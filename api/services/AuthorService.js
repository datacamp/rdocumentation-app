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
    var match = person.match(Utils.emailRegex);
    var personJSON = {};
    if(match) {
      person = person.replace(Utils.emailRegex, '');
      personJSON.email = match[0].trim();
    }

    personJSON.name = person.match(/(\s*([A-Z][^\s,&]*)\s*)+/)[0].trim();

    return personJSON;

  },

  authorsSanitizer: function(authorString) {
    // var authorString = "Jean Marc and Ally Son, RIP R. & Hello World!"
    var sanitized = authorString.replace('<email>', '')
                                .replace('</email>', '')
                                .trim();


    var separated = sanitized.split(/,|and|&|;/);

    var trimmed = separated.map(function(item) {return item.trim();});

    var mapped = trimmed.map(AuthorService.extractPersonInfo);

    return mapped;

  },

  recoverAuthorsR: function(json){
      //var json = JSON.parse(sourceJSON);
      var person = json["Authors@R"].split("person(");
      person.shift();
      var hasMaintainer = false;
      var result = {
        contributors : [],
        maintainer : {}
      };
      person.forEach(function(str){
        var list = str.split(",");
        var name = "", family = "", email, isMaintainer = false;
        name = list.shift().split("\"")[1];
        family = list.shift().split("\"")[1];
        list.forEach(function(piece){
          if(piece.indexOf("email")>=0){
            email = piece.split("\"")[1];
          }
          if(piece.indexOf("cre")>=0&&!hasMaintainer){
            isMaintainer=true;
            hasMaintainer=true;
          }
        });
        fullName = name+" "+family;
        var author = {};
        author.name = fullName;
        author.email = email;
        result.contributors.push(author);
        if(isMaintainer){
          result.maintainer = author;
        }
        });
      return result;
  },

  parseAllAuthors: function(){
    return PackageVersion.getAllVersions().then(function(Results){
      var promises = [];
      Results.forEach(function(Result){
      if(Result.sourceJSON){
        json = JSON.parse(Result.sourceJSON);
        try{
        var auth = {contributors : []};
        if(json["Authors@R"]){
          var auth = AuthorService.recoverAuthorsR(json);
        }
        else{
          if(json["Author"]){
            auth["contributors"]=AuthorService.authorsSanitizer(json["Author"]); 
          }
          if(json["Maintainer"]){
          auth["maintainer"]  =AuthorService.authorsSanitizer(json["Maintainer"])[0];
          }
        }
        promises.push(Collaborator.insertAllAuthors(auth,Result));
      }
      catch(err){
        console.log("Warning: " + Result.id);
        console.log(json["Author"]);
        console.log(json["Maintainer"]);
      }
    }
      });
      return Promise.all(promises);
    })
  }
};