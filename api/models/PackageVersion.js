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
      type: Sequelize.STRING,
      allowNull: false
    },

    description: {
      type: Sequelize.TEXT,
      allowNull: false
    },

    release_date: {
      type: Sequelize.DATE,
    },

    license: {
      type: Sequelize.STRING,
      allowNull: false
    },

    url: {
      type: Sequelize.TEXT,
    },

    copyright: {
      type: Sequelize.STRING
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
          allowNull: false,
          name: 'maintainer_id',
          as: 'maintainer'
        }
      });
    PackageVersion.belongsToMany(Collaborator, {as: 'collaborators', through: 'Collaborations', foreignKey: 'authored_version_id', timestamps: false});

    PackageVersion.hasMany(Topic, {as: 'topics', foreignKey: 'package_version_id'});
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
          .replace(':name', this.getDataValue('package_name'))
          .replace(':version', this.getDataValue('version'))
          .replace('/api/', '/');
      },
      api_uri: function()  {
        return sails.getUrlFor({ target: 'PackageVersion.findByNameVersion' })
          .replace(':name', this.getDataValue('package_name'))
          .replace(':version', this.getDataValue('version'));
      }
    },

    classMethods: {

      createWithDescriptionFile: function(opts) {
        var description = opts.input;
        var packageVersion = PackageService.mapDescriptionToPackageVersion(description);

        return sequelize.transaction(function (t) {
          var package = Package.findOrCreate({
            where: packageVersion.package,
            transaction: t
          });

          var maintainer = Collaborator.findOrCreate({
            where: {email: packageVersion.maintainer.email},
            transaction: t,
            defaults: packageVersion.maintainer
          });

          var authors = Promise.map(packageVersion.authors, function(author) {
            return Collaborator.findOrCreate({
              where: {email: author.email},
              transaction: t,
              defaults: author
            }).spread(function(instance, created) {
              return instance;
            });
          });

          var dependencies = Package.bulkCreate(packageVersion.dependencies.map(function(dependency) {
            return {name: dependency.dependency_name};
          }), {
            transaction: t,
            fields: ['name'],
            ignoreDuplicates: true
          });


          return Promise.join(package, maintainer, authors, dependencies,
            function(packageInstance, maintainerInstance, authorInstances) {

              return PackageVersion.findOrInitialize(
                {
                  where: {
                    package_name: packageVersion.package.name,
                    version: packageVersion.fields. version
                  },
                  transaction: t
              }).spread(function(packageVersionInstance, initialized) {
                packageVersionInstance.set(packageVersion.fields);
                packageVersionInstance.setPackage(packageInstance[0], {save: false});
                packageVersionInstance.setMaintainer(maintainerInstance[0], {save: false});
                return packageVersionInstance.save({transaction: t});
              }).then(function(packageVersionInstance) {
                var dependencies = packageVersion.dependencies.map(function(dependency) {
                  return _.merge(dependency, {dependant_version_id: packageVersionInstance.id});
                });

                var dep = Dependency.bulkCreate(dependencies, {
                  ignoreDuplicates: true,
                  transaction: t
                });
                var auth = packageVersionInstance.setAuthors(authorInstances, {transaction: t});
                return Promise.join(dep, auth,
                  function(dependencies, authors) {
                    return packageVersionInstance;
                  });
              });

          });

        });
      }



    },

    underscored: true
  }


};

