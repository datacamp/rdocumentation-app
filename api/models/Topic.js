/**
 * Topic.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var _ = require('lodash');
var Promise = require('bluebird');

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
      type: Sequelize.TEXT,
    },

    usage: {
      type: Sequelize.TEXT,
    },

    details: {
      type: Sequelize.TEXT,
    },

    value: {
      type: Sequelize.TEXT,
    },

    references: {
      type: Sequelize.TEXT,
    },

    note: {
      type: Sequelize.TEXT,
    },

    author: {
      type: Sequelize.TEXT,
    },

    seealso: {
      type: Sequelize.TEXT,
    },

    examples: {
      type: Sequelize.TEXT,
    },



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
            {model: Argument, as: 'arguments', attributes: ['name', 'description']},
            {model: Section, as: 'sections', attributes: ['name', 'description']},
            {model: Tag, as: 'keywords', attributes: ['name']},
            {model: Alias, as: 'aliases', attributes: ['name']}
          ]
        }, opts, customizer);

        return Topic.findOne(options);
      },

      createWithRdFile: function(opts) {
        var rdJSON = opts.input;
        return sequelize.transaction(function (t) {
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

          var reduceArrayToString = function(array) {
            return array.reduce(function(acc, item) {
              if ( typeof item === 'string') {
                return acc + item;
              } else if ( typeof item === 'object') {
                for (var key in item) {
                  acc += '<' + key + '>' + item[key] + '</' + key + '>';
                }
                return acc;
              }

            }, '');
          };

          var topic = _.pick(rdJSON, attributes);
          if (topic.value instanceof Array) {
            var valueArray = topic.value;
            topic.value = reduceArrayToString(reduceArrayToString);
          }
          var customSections = _.omit(rdJSON, attributes.concat(['alias', 'arguments', 'keyword', 'author', 'docType', 'Rdversion']));
          topic.author = rdJSON.author ? rdJSON.author.map(function(author){
            return author.name + ' ' +author.email;
          }).join(', ') : rdJSON.author;

          customSections = customSections.map(function(section) {
            if (section instanceof Array) {
              return reduceArrayToString(section);
            } else return section;
          });

          return PackageVersion.findOne({
            where: {package_name: opts.packageName, version: opts.packageVersion },
            transaction: t
          }).then(function(version) {
            if (version === null) throw {
              status: 404,
              message: 'Package ' + opts.packageName + ' Version ' + opts.packageVersion + ' cannot be found'
            };
            else topic.package_version_id = version.id;


            var keywords = rdJSON.keyword && !(rdJSON.keyword instanceof Array) ? [rdJSON.keyword] : rdJSON.keyword;
            var keywordsRecords =  _.isEmpty(keywords) ? [] :
              _.chain(keywords)
                .map(function(entry) { return entry.split(','); })
                .flatten()
                .map(function(keyword) {
                  return {name: keyword};
                })
                .value();

            return Promise.join(
              Topic.create(topic, {
                include: [ {model: Tag, as: 'keywords'} ]
              }),
              Tag.bulkCreate(keywordsRecords, {transaction:t, ignoreDuplicates: true})
              .then(function(instances) {
                var names = _.map(instances, function (inst) {
                  return inst.name;
                });
                return Tag.findAll({where: {name: {$in: names}}, transaction:t });
              }),
              function(topicInstance, keywordsInstances) {
                var topicArguments = _.isEmpty(rdJSON.arguments) ? [] : rdJSON.arguments.map(function(argument) {
                  return _.merge({}, argument, {topic_id: topicInstance.id});
                });

                var aliases = rdJSON.alias && !(rdJSON.alias instanceof Array) ? [rdJSON.alias] : rdJSON.alias;
                var aliasesRecords = _.isEmpty(aliases) ? [] : aliases.map(function(alias) {
                  return {name: alias, topic_id: topicInstance.id};
                });


                var sections = _.toPairs(customSections).map(function(pair) {
                  return { name: pair[0], description: pair[1], topic_id: topicInstance.id };
                });

                return Promise.all([
                  Argument.bulkCreate(topicArguments, {transaction: t}),
                  Alias.bulkCreate(aliasesRecords, {transaction: t}),
                  Section.bulkCreate(sections, {transaction: t}),
                  topicInstance.addKeywords(keywordsInstances, {transaction: t })
                ]).then(_.partial(Topic.findOnePopulated, {id: topicInstance.id}, {transaction: t}));
            });
          });

        });

      }
    }
  }


};

