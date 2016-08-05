/**
 * PackageVersion.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var Promise = require('bluebird');
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
        if(!this.package.latest_version) return null;
        return sails.getUrlFor({ target: 'PackageVersion.findByNameVersion' })
          .replace(':name', encodeURIComponent(this.getDataValue('package_name')))
          .replace(':version', encodeURIComponent(this.package.latest_version.version))
          .replace('/api/', '/');
      }
    },

    classMethods: {
      getLatestVersion:function(packageName){
        return PackageVersion.findOne({
          where:{package_name:packageName},
          order: [[sequelize.fn('ORDER_VERSION', sequelize.col('PackageVersion.version')), 'DESC' ]]
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
        return PackageVersion.findOne({
          where: conditions,
          include: [
            { model: Collaborator, as: 'maintainer' },
            { model: Collaborator, as: 'collaborators' },
            { model: Package, as: 'dependencies' },
            { model: Package, as: 'package', include: [
                { model: PackageVersion, as: 'versions', attributes:['package_name', 'version'], separate: true },
                { model: PackageVersion, as: 'latest_version', attributes:['package_name', 'version'] },
                { model: TaskView, as: 'inViews', attributes:['name'] }
              ],
              attributes: ['name', 'latest_version_id', 'type_id']
            },
            { model: Topic, as: 'topics',
              attributes: ['package_version_id', 'name', 'title', 'id'],
              include:[{model: Review, as: 'reviews'}],
              separate: true },
            { model: Review, as: 'reviews', separate: true,
              include: [{model: User, as: 'user', attributes: ['username', 'id']}]
            }
          ],
          order: [[sequelize.fn('ORDER_VERSION', sequelize.col('PackageVersion.version')), 'DESC' ]]
        })
        .then(function(versionInstance) {
          if(versionInstance === null) return null;
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
          });
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
          var package = Repository.findOrCreate({
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


          return Promise.join(package, dependencies,
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
                      order: [[sequelize.fn('ORDER_VERSION', sequelize.col('version')), 'DESC' ]],
                      transaction: t
                    }).then(function(versionInstances) {
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
      }



    },

    underscored: true
  }


};

