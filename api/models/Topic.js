/**
 * Topic.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var _ = require('lodash');

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
          name: 'package_version_id',
          as: 'package_version'
        }
      });

    Topic.hasMany(Argument, {as: 'arguments', foreignKey: 'topic_id'});

    Topic.hasMany(Section, {as: 'sections', foreignKey: 'topic_id'});

    Topic.hasMany(Alias, {as: 'aliases', foreignKey: 'topic_id'});

    Topic.hasMany(Tag, {as: 'keywords', foreignKey: 'topic_id'});
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
          var topic = _.pick(rdJSON, attributes);
          var customSections = _.omit(rdJSON, attributes.concat(['alias', 'arguments', 'keyword', 'author']));



          return PackageVersion.findOne({
            where: {package_name: opts.packageName, version: opts.packageVersion }
          }).then(function(version) {
            if (version === null) throw 404;
            return Topic.create(topic, {transaction: t})
              .then(function(topicInstance) {

                var topicArguments = _.isEmpty(rdJSON.arguments) ? [] : rdJSON.arguments.map(function(argument) {
                  return _.merge({}, argument, {topic_id: topicInstance.id});
                });

                var aliases = rdJSON.alias && !(rdJSON.alias instanceof Array) ? [rdJSON.alias] : rdJSON.alias;
                var aliasesRecords = _.isEmpty(aliases) ? [] : aliases.map(function(alias) {
                  return {name: alias, topic_id: topicInstance.id};
                });

                var keywords = rdJSON.keyword && !(rdJSON.keyword instanceof Array) ? [rdJSON.keyword] : rdJSON.keyword;
                var keywordsRecords =  _.isEmpty(keywords) ? [] :
                  _.chain(keywords)
                    .map(function(entry) {console.log(entry); return entry.split(','); })
                    .flatten()
                    .map(function(keyword) {
                      return {name: keyword, topic_id: topicInstance.id};
                    })
                    .value();

                var sections = _.toPairs(customSections).map(function(pair) {
                  return { name: pair[0], description: pair[1], topic_id: topicInstance.id };
                });
                console.log(sections);


                return Promise.all([
                  Argument.bulkCreate(topicArguments, {transaction: t}),
                  Alias.bulkCreate(aliasesRecords, {transaction: t}),
                  Tag.bulkCreate(keywordsRecords, {transaction: t}),
                  Section.bulkCreate(sections, {transaction: t})
                ]).then(function() {
                  return Topic.findOne({
                    where: {id: topicInstance.id},
                    transaction: t,
                    include: [
                      {model: Argument, as: 'arguments'},
                      {model: Section, as: 'sections'},
                      {model: Tag, as: 'keywords'},
                      {model: Alias, as: 'aliases'}
                    ]
                  });
                });
            });
          });

        });

      }
    }
  }


};

