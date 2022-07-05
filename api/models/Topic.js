/**
 * Topic.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var _ = require('lodash');
var Promise = require('bluebird');
var sanitizeHtml = require('sanitize-html');

module.exports = {

  attributes: {
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },

    title: {
      type: Sequelize.TEXT,
      allowNull: false
    },

    description: {
      type: Sequelize.TEXT
    },

    usage: {
      type: Sequelize.TEXT
    },

    details: {
      type: Sequelize.TEXT
    },

    value: {
      type: Sequelize.TEXT
    },

    references: {
      type: Sequelize.TEXT
    },

    note: {
      type: Sequelize.TEXT
    },

    author: {
      type: Sequelize.TEXT
    },

    seealso: {
      type: Sequelize.TEXT
    },

    examples: {
      type: Sequelize.TEXT
    },

    sourceJSON: {
      type: Sequelize.TEXT,
      allowNull: true
    }


  },
  associations: function() {
    Topic.belongsTo(PackageVersion,
      {
        as: 'package_version',
        foreignKey: {
          allowNull: false,
          required: true,
          name: 'package_version_id',
          as: 'package_version'
        }
      });

    Topic.hasMany(Argument, {as: 'arguments', foreignKey: 'topic_id'});

    Topic.hasMany(Section, {as: 'sections', foreignKey: 'topic_id'});

    Topic.hasMany(Alias, {as: 'aliases', foreignKey: 'topic_id'});

    Topic.hasMany(Review, {
      as: 'reviews',
      foreignKey: 'reviewable_id',
      constraints: false,
      scope: {
        reviewable: 'topic'
      }
    });

    Topic.hasMany(Example, { as: 'user_examples', foreignKey: 'topic_id' });

    Topic.belongsToMany(Tag, {as: 'keywords', through: 'TopicTags', foreignKey: 'topic_id', timestamps: false});
  },

  options: {
    underscored: true,

    indexes: [
      {
        type: 'UNIQUE',
        fields: ['name', 'package_version_id']
      }
    ],

    getterMethods: {
      uri: function()  {
        if (this.package_version) {
          return '/api/packages/:name/versions/:version/topics/:topic'
            .replace(':name', encodeURIComponent(this.package_version.package_name))
            .replace(':version', encodeURIComponent(this.package_version.version))
            .replace(':topic', encodeURIComponent(this.name))
            .replace('/api/', '/');
        } return sails.getUrlFor({ target: 'Topic.findById' })
          .replace(':id', encodeURIComponent(this.id))
          .replace('/api/', '/');
      },
      api_uri: function()  {
        if (this.package_version) {
          return '/api/packages/:name/versions/:version/topics/:topic'
            .replace(':name', encodeURIComponent(this.package_version.package_name))
            .replace(':version', encodeURIComponent(this.package_version.version))
            .replace(':topic', encodeURIComponent(this.name));
        } return sails.getUrlFor({ target: 'Topic.findById' })
          .replace(':id', encodeURIComponent(this.id));
      }
    },

    classMethods: {
      findOnePopulated: function(criteria, opts) {
        function customizer(objValue, srcValue) {
          if (_.isArray(objValue)) {
            return objValue.concat(srcValue);
          }
        }
        var options = _.mergeWith({
          where: criteria,
          include: [
            {model: Argument, as: 'arguments', attributes: ['name', 'description', 'topic_id'], separate: true },
            {model: Section, as: 'sections', attributes: ['name', 'description', 'topic_id'], separate: true },
            {model: Tag, as: 'keywords', attributes: ['name']},
            {model: Alias, as: 'aliases', attributes: ['name', 'topic_id'], separate: true },
            {model: Example, as: 'user_examples',
              include: [{model: User, as: 'user', attributes: ['username']}]
            },
            { model: PackageVersion,
              as: 'package_version',
              attributes: ['package_name', 'version']
            }
          ]
        }, opts, customizer);

        return Topic.findOne(options);
      },

      findByNameInPackage: function(packageName, name, version) {
        var packageCriteria = {
          package_name: packageName
        };

        if (version) { // if version is specified, find in this one
          packageCriteria.version = version;
        }

        var params = {
          where: { name: name },
          include: [
            { model: PackageVersion, as: 'package_version', attributes: ['package_name', 'version'], where: packageCriteria }
          ]
        };

        return Promise.join(
          Topic.findAll(params),
          Topic.findByAliasInPackage(packageName, name, version),
        function(topics, aliasesTopics) {
          return topics.concat(aliasesTopics).sort(PackageService.compareVersions('desc', function(topic) {
            return topic.package_version.version;
          })
          )[0];
        });
      },

      findByAliasInPackage: function(packageName, alias, version) {
        var packageCriteria = {
          package_name: packageName
        };

        if (version) { // if version is specified, find in this one
          packageCriteria.version = version;
        }

        var params = {
          include: [
            { model: PackageVersion, as: 'package_version', attributes: ['package_name', 'version'], where: packageCriteria },
            { model: Alias, as: 'aliases', attributes: ['name', 'topic_id'], where: { name: alias }}
          ]
        };

        return Topic.findAll(params).then(function(topicInstances) {
          if (topicInstances) {
            return topicInstances.sort(PackageService.compareVersions('desc', function(topic) {
              return topic.package_version.version;
            })
          )[0];
          }
          return topicInstances;
        });
      },

      createWithRdFile: function(opts) {
        var rdJSON = opts.input;
        return sequelize.transaction(function(t) {
          var attributes = [
            'name',
            'title',
            'description',
            'usage',
            'details',
            'value',
            'references',
            'note',
            'seealso',
            'examples'
          ];

          var topic = _.pick(rdJSON, attributes);

          if (topic.usage !== null && typeof topic.usage === 'object') {
            topic.usage = topic.usage.contents;
          }

          if (topic.description !== null && typeof topic.description === 'object') {
            topic.description = topic.description.contents;
          }

          topic.examples = sanitizeHtml(topic.examples, {
            allowedTags: [],
            allowedAttributes: {}
          });

          var arrayToString = function(val) {
            if (val instanceof Array) {
              if (_.isEmpty(val)) return '';
              return val.join('\n\n');
            } return val;
          };

          topic = _.mapValues(topic, arrayToString);

          var customSections = rdJSON.sections;

          customSections = _.map(customSections, function(section) {
            return _.mapValues(section, arrayToString);
          });

          topic.sourceJSON = JSON.stringify(rdJSON);

          var packageVersion = {
            package_name: opts.packageName,
            version: opts.packageVersion,
            description: '',
            license: ''
          };

          return PackageVersion.upsertPackageVersion(packageVersion, {
            transaction: t
          }).spread(function(version, created) {
            topic.package_version_id = version.id;


            var keywords = rdJSON.keywords && !(rdJSON.keywords instanceof Array) ? [rdJSON.keywords] : rdJSON.keywords;
            var keywordsRecords =  _.isEmpty(keywords) ? [] :
              _.chain(keywords)
                .map(function(entry) { return entry.split(','); })
                .flatten()
                .map(function(keyword) {
                  return {name: keyword};
                })
                .value();

            return Promise.join(
              Topic.findOrCreate({
                where: {
                  package_version_id: version.id,
                  name: topic.name
                },
                defaults: topic,
                transaction: t,
                include: [
                  {model: Tag, as: 'keywords'},
                  {model: Argument, as: 'arguments'},
                  {model: Section, as: 'sections'},
                  {model: Alias, as: 'aliases'}
                ]
              }),
              Tag.bulkCreate(keywordsRecords, {transaction: t, ignoreDuplicates: true})
              .then(function(instances) {
                var names = _.map(instances, function(inst) {
                  return inst.name;
                });
                return Tag.findAll({where: {name: {$in: names}}, transaction: t });
              }),
              function(instanceCreatedArray, keywordsInstances) {
                var topicInstance = instanceCreatedArray[0];
                topicInstance.set(_.pick(topic, ['title',
                  'description',
                  'usage',
                  'details',
                  'value',
                  'references',
                  'note',
                  'seealso',
                  'examples',
                  'author',
                  'sourceJSON'])
                );

                var aliases = rdJSON.aliases && !(rdJSON.aliases instanceof Array) ? [rdJSON.aliases] : rdJSON.aliases;
                var aliasesRecords = _.isEmpty(aliases) ? [] : aliases.map(function(alias) {
                  return {name: alias, topic_id: topicInstance.id};
                });


                var sections = customSections.map(function(section) {
                  var sect = _.mapValues(section, arrayToString);
                  return { name: sect.title, description: sect.contents, topic_id: topicInstance.id };
                });

                return Promise.all([
                  topicInstance.removeSections(topicInstance.sections),
                  topicInstance.removeAliases(topicInstance.aliases),
                  Alias.bulkCreate(aliasesRecords, {transaction: t}),
                  Section.bulkCreate(sections, {transaction: t}),
                  topicInstance.setKeywords(keywordsInstances, {transaction: t }),
                  topicInstance.save({transaction: t})
                ]).then(_.partial(Topic.findOnePopulated, {id: topicInstance.id}, {transaction: t}));
              });
          });
        });
      }
    }
  }


};

