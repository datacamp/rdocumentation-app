var Promise = require('bluebird');
var _ = require('lodash');
cheerio = require('cheerio');

module.exports = {
	helpFindByTopicsAndPackages :function(topicNames,packageNames){
		return Alias.orderedFindByTopicsAndPackages(topicNames,packageNames).then(function(results){
			if (results.length == 0) return []; //no match found anywhere
            if (results.length == 1) { //if there is only 1 match, redirect to this one (except if function is going to run on mutltiple aliases)
        		return Topic.findOnePopulated({id: results[0].id}, {
			        include: [{
			          model: PackageVersion,
			          as: 'package_version',
			          attributes: ['package_name', 'version']
			        }]
			      }).then(function(topic) {
			        if(topic === null) return [];
			        else {
			          return TopicService.computeLinks('/link/', topic)
			            .then(function(topic) {
			              topic.pageTitle = topic.name;
			              return [topic];
			            });
			        }
			    });
			}
            return results; //return all matches to list
		});
	},
	helpFindByAlias:function(alias){
		return Alias.orderedFindByAlias(alias).then(function(results){
			if (results.length == 0) return []; //no match found anywhere
            if (results.length == 1) { //if there is only 1 match, redirect to this one (except if function is going to run on mutltiple aliases)
        		return Topic.findOnePopulated({id: results[0].id}, {
			        include: [{
			          model: PackageVersion,
			          as: 'package_version',
			          attributes: ['package_name', 'version']
			        }]
			      }).then(function(topic) {
			        if(topic === null) return [];
			        else {
			          return TopicService.computeLinks('/link/', topic)
			            .then(function(topic) {
			              topic.pageTitle = topic.name;
			              return [topic];
			            });
			        }
			    });
			}
            return results; //return all matches to list
		});
	},
  	findPackage:function(packageName){
  		return PackageVersion.findOne({
        where: {
          package_name: packageName
        },
        include: [
          { model: Collaborator, as: 'maintainer' },
          { model: Collaborator, as: 'collaborators' },
          { model: Package, as: 'dependencies' },
          { model: Package, as: 'package', include: [
            { model: PackageVersion, as: 'versions', attributes:['package_name', 'version'], separate: true },
            { model: TaskView, as: 'inViews', attributes:['name'] }
          ]},
          { model: Topic, as: 'topics',
            attributes: ['package_version_id', 'name', 'title', 'id'],
            include:[{model: Review, as: 'reviews'}],
            separate: true },
          { model: Review, as: 'reviews', separate: true,
            include: [{model: User, as: 'user', attributes: ['username', 'id']}]
          }
        ],
        order: [[sequelize.fn('ORDER_VERSION', sequelize.col('version')), 'DESC' ]]
      })
      .then(function(versionInstance) {
      	if(versionInstance == null){
      		return null;
      	}
      	else{
			return Review.findOne({
			  attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'rating']],
			  where: {
			    reviewable_id: versionInstance.id,
			    reviewable: 'version'
			  },
			  group: ['reviewable_id']
			}).then(function(ratingInstance) {
			  if (ratingInstance === null) return versionInstance.toJSON();
			  var version = versionInstance.toJSON();
			  version.rating = ratingInstance.getDataValue('rating');
			  return version;
			}).then(function(version) {
			  if (version.url) version.url = version.url.autoLink({ target: "_blank", id: "1" });
			  return version;
			})
		}
		})
		.catch(function(err){
			console.log(err.message);
		})	
			// The method above will be cached
			.then(function(version){
			  if(version === null){
			  	return null;
			  }
			  else {
			    version.pageTitle = version.package_name + ' v' + version.version;
			    return version
			  }
	  	});
    }
       
};