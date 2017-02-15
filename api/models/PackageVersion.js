/**
 * PackageVersion.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var Promise = require('bluebird');
var dateFormat = require('dateformat');
var _ = require('lodash');

module.exports = {

  attributes: {
    package_name: {
      type: Sequelize.STRING,
      allowNull: false
    },

    version: {
      type: Sequelize.STRING,
      allowNull: false
    },

    title: {
      type: Sequelize.TEXT
    },

    description: {
      type: Sequelize.TEXT,
      allowNull: false
    },

    release_date: {
      type: Sequelize.DATE,
      allowNull: true
    },

    license: {
      type: Sequelize.TEXT,
      allowNull: false
    },

    url: {
      type: Sequelize.TEXT,
    },

    copyright: {
      type: Sequelize.TEXT
    },

    readmemd: {
      type: Sequelize.TEXT,
      allowNull: true
    },

    sourceJSON: {
      type: Sequelize.TEXT,
      allowNull: true
    }


  },
  associations: function() {
    PackageVersion.belongsTo(Package,
      {
        as: 'package',
        foreignKey: {
          allowNull: false,
          name:'package_name',
          as: 'package'
        },
        onDelete: 'CASCADE'
      });

    PackageVersion.hasOne(Package, {as: 'package_latest', foreignKey : 'latest_version_id'});

    PackageVersion.belongsToMany(Package,
      { as: 'dependencies',
        through: Dependency,
        foreignKey: {
          name: 'dependant_version_id',
          as: 'dependencies'
        }
      });
    PackageVersion.belongsTo(Collaborator,
      {
        as: 'maintainer',
        foreignKey: {
          allowNull: true,
          name: 'maintainer_id',
          as: 'maintainer'
        }
      });
    PackageVersion.belongsToMany(Collaborator, {as: 'collaborators', through: 'Collaborations', foreignKey: 'authored_version_id', timestamps: false});

    PackageVersion.hasMany(Topic, {as: 'topics', foreignKey: 'package_version_id'});

    PackageVersion.hasMany(Review, {
      as: 'reviews',
      foreignKey: 'reviewable_id',
      constraints: false,
      scope: {
        reviewable: 'version'
      }
    });
  },

  options: {
    indexes: [
      {
        type: 'UNIQUE',
        fields: ['package_name', 'version']
      }
    ],

    getterMethods: {
      uri: function()  {
        return sails.getUrlFor({ target: 'PackageVersion.findByNameVersion' })
          .replace(':name', encodeURIComponent(this.getDataValue('package_name')))
          .replace(':version', encodeURIComponent(this.getDataValue('version')))
          .replace('/api/', '/');
      },
      api_uri: function()  {
        return sails.getUrlFor({ target: 'PackageVersion.findByNameVersion' })
          .replace(':name', encodeURIComponent(this.getDataValue('package_name')))
          .replace(':version', encodeURIComponent(this.getDataValue('version')));
      },
      canonicalLink: function() {
        if(!this.package) return null;
        if(!this.package.versions) return null;
        this.package.versions.sort(PackageService.compareVersions('desc', 'version'));
        return sails.getUrlFor({ target: 'PackageVersion.findByNameVersion' })
          .replace(':name', encodeURIComponent(this.getDataValue('package_name')))
          .replace(':version', encodeURIComponent(this.package.versions[0].version))
          .replace('/api/', '/');
      }
    },

    classMethods: {
      getLatestVersion:function(packageName){
        return PackageVersion.findAll({
          where:{package_name:packageName}
        }).then(function (versions) {
          if (versions && versions.length > 0)
            return versions.sort(PackageService.compareVersions('desc', 'version'))[0];
          else return null;
        });
      },

      getAllVersions: function(){
        return PackageVersion.findAll();
      },

      upsertPackageVersion: function(packageVersion, opts) {

        var options = _.defaults(_.clone(opts), { where: {name: packageVersion.package_name} });
        return Package.findOrCreate(options).spread(function(instance, created) {
          var options = _.defaults(_.clone(opts), {
            where: {
              package_name: packageVersion.package_name,
              version: packageVersion.version
            },
            defaults: packageVersion,
          });
          return PackageVersion.findOrCreate(options);
        });
      },

      getPackageVersionFromCondition:function(conditions){

        var packagePromise = PackageVersion.findOne({
          where: conditions,
          include: [
            { model: Collaborator, as: 'maintainer' },
            { model: Package, as: 'package', include: [
                { model: PackageVersion, as: 'versions', attributes:['package_name', 'version'], separate: true },
                { model: Star, as: 'stars', attributes: ['package_name', 'user_id' ] }
              ],
              attributes: { include: [[sequelize.fn('COUNT', sequelize.col('package.stars.user_id')), 'star_count']] },

            },
            { model: Topic, as: 'topics',
              attributes: ['package_version_id', 'name', 'title', 'id'],
              separate: true }
          ]
        })

        var collaboratorsPromise = Collaborator.findAll({
          include: [
            { model: PackageVersion, as: 'authored_packages', required: true, where: conditions }
          ]
        });

        var dependencyPromise = Dependency.findAll({
          include: [
            { model: PackageVersion, as: 'dependant', required: true, attributes: ['package_name', 'version'], where: conditions }
          ],
        });

        return Promise.join(packagePromise, collaboratorsPromise, dependencyPromise,
        function(versionInstance, collaboratorsInstances, dependencyInstances) {
          if(versionInstance === null) return null;
          const versionJSON = versionInstance.toJSON()
          versionJSON.collaborators = collaboratorsInstances.map(function(x) { return x.toJSON(); });
          versionJSON.dependencies = dependencyInstances.map(function(x) { return x.toJSON(); });
          versionJSON.package.versions = versionJSON.package.versions.sort(PackageService.compareVersions('desc', 'version'));
          return versionJSON;
        })
        .catch(function(err){
          console.log(err.message);
        });
      },

      createWithDescriptionFile: function(opts) {
        var description = opts.input;
        var type = description.repoType || 'cran';
        var readmemd = description.readme;
        var packageVersion = PackageService.mapDescriptionToPackageVersion(description);
        packageVersion.fields.sourceJSON = JSON.stringify(description);
        packageVersion.fields.readmemd = readmemd;
        packageVersion.fields.license = packageVersion.fields.license || "";

        return sequelize.transaction(function (t) {
          var _package = Repository.findOrCreate({
            where: {name: type},
            transaction: t
          }).spread(function(repoInstance, created){
            return Package.upsert({
              name: packageVersion.package.name,
              type_id: repoInstance.id
            }, {
              transaction: t
            });
          });

          var dependencies = Package.bulkCreate(packageVersion.dependencies.map(function(dependency) {
            return {name: dependency.dependency_name};
          }), {
            transaction: t,
            fields: ['name'],
            ignoreDuplicates: true
          });


          return Promise.join(_package, dependencies,
            function(packageInstance) {

              return PackageVersion.findOrInitialize(
                {
                  where: {
                    package_name: packageVersion.package.name,
                    version: packageVersion.fields.version
                  },
                  transaction: t
              }).spread(function(packageVersionInstance, initialized) {
                packageVersionInstance.set(packageVersion.fields);
                packageVersionInstance.setPackage(packageVersion.package.name, {save: false});
                return packageVersionInstance.save({transaction: t});
              }).then(function(packageVersionInstance) {
                var dependencies = packageVersion.dependencies.map(function(dependency) {
                  return _.merge(dependency, {dependant_version_id: packageVersionInstance.id});
                });

                var dep = Dependency.bulkCreate(dependencies, {
                  ignoreDuplicates: true,
                  transaction: t
                });
                return Promise.join(dep, Collaborator.replaceAllAuthors(packageVersion.authors, packageVersionInstance, {transaction:t}),
                  function(dependencies, authors) {
                    return PackageVersion.findAll({
                      where: {
                        package_name: packageVersion.package.name
                      },
                      transaction: t
                    })
                    .then(function(versionInstances) {
                      return versionInstances.sort(PackageService.compareVersions('desc', function(version) {
                        return version.version
                      }));
                    })
                    .then(function(versionInstances) {
                      return Package.update({
                          latest_version_id: versionInstances[0].id
                        },
                        {
                          where: { name: packageVersion.package.name },
                          transaction: t
                        }
                      ).then(function() {
                        return PackageVersion.update({
                          updated_at: null
                        }, {
                          where: {
                            id: { $in: versionInstances.map(function(v) {
                              return v.id;
                            })}
                          },
                          transaction: t
                        });
                      }).then(function(count) {
                        return packageVersionInstance;
                      });
                    });

                  });
              });

          });

        });
      },

      getPackagesByDate: function(page, dateExpression) {
        return sequelize.query("SELECT package_name, " + dateExpression + " as rel FROM PackageVersions where release_date < now() group by package_name order by rel Desc Limit :offset,10",
          {replacements: { offset: (page-1)*10 }, type: sequelize.QueryTypes.SELECT })
          .then(function(records) {
            return records.map(function(record) {
              record.rel = dateFormat(record.rel);
              return record;
            });
          });
      },

      getNewestPackages: function(page) {
        return PackageVersion.getPackagesByDate(page, "min(release_date)");
      },

      getLatestUpdates: function(page){
        return PackageVersion.getPackagesByDate(page, "max(release_date)");
      }
    },

    underscored: true
  }


};

