/**
 * Alias.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
_ = require('lodash');
var Promise = require('bluebird');

module.exports = {

  attributes: {

    name: {
      type: Sequelize.STRING,
      allowNull: false
    }

  },

  associations: function() {
    Alias.belongsTo(Topic, { as: 'topic', foreignKey: 'topic_id'});
  },

  options: {
    underscored: true,
    timestamps: false,

    indexes: [{
      name: 'name_index',
      method: 'BTREE',
      fields: ['name']
    }],

    classMethods: {
      findByNameInLatestVersions: function(name) {
        return Alias.findAll({
          include: [
            {
              model: Topic,
              as: 'topic',
              attributes: ['id', 'name'],
              include: [{
                model: PackageVersion,
                as: 'package_version',
                attributes: ['package_name', 'version'],
                include: [{
                  model: Package,
                  as: 'package_latest',
                  required: true,
                  attributes: [],
                }]
              }]
            }
          ],
          where: { name: name }
        });
      },
      orderedFindByAlias : function(alias) {
        return Alias.findAll({
          attributes: ['id',['name','alias']],
          include:[{
            model:Topic,
            as:'topic',
            attributes:['id','name','description'],
            include:[{
              model:PackageVersion,
              as:'package_version',
              attributes:['id','package_name'],
              required:true,
              include:[{
                model:Package,
                as:'package_latest',
                required:false,
                attributes:['latest_version_id'],
                include:[{
                  model:DownloadStatistic,
                  as:'last_month_stats',
                  required : false,
                  attributes:[],
                  where:{date :{
                    $gte: new Date(new Date() - 30*24 * 60 * 60 * 1000)
                  }}
                }]
              }]
            }]
          }],
          where:{name:alias},
          group:['topic.name','topic.package_version.id','topic.id','Alias.id','topic.package_version.package_latest.name'],
          order:[sequelize.fn('SUM', sequelize.col('topic.package_version.package_latest.last_month_stats.direct_downloads'))]
        }).then(function(data){
            allResults = _.map(data,function(record){
            return {
              id:record.topic.id,
              package_name:record.topic.package_version.package_name,
              function_name:record.topic.name,
              function_alias: alias,
              function_description:record.topic.description
              };
          })
          return allResults; 
        }).catch(function(err){
          console.log(err.message);
        });
      },
      orderedFindByAliasAndPackages : function(alias,packageNames) {
        return Alias.findAll({
          attributes: ['id',['name','alias']],
          include:[{
            model:Topic,
            as:'topic',
            attributes:['id','name','description'],
            include:[{
              model:PackageVersion,
              as:'package_version',
              attributes:['id','package_name'],
              include:[{
                model:Package,
                as:'package_latest',
                required:true,
                attributes:['latest_version_id'],
                include:[{
                  model:DownloadStatistic,
                  as:'last_month_stats',
                  required:false,
                  attributes:[],
                  where:{date :{
                    $gte: new Date(new Date() - 30*24 * 60 * 60 * 1000)
                  }}
                }]
              }],
              where:{
                package_name:{
                  $in : packageNames
                }
              }
            }]
          }],
          where:{name:alias},
          group:['topic.name','topic.package_version.id','topic.id','Alias.id','topic.package_version.package_latest.name'],
          order:[sequelize.fn('SUM', sequelize.col('topic.package_version.package_latest.last_month_stats.direct_downloads'))]
        }).then(function(data){
            allResults = _.map(data,function(record){
            return {
              id:record.topic.id,
              package_name:record.topic.package_version.package_name,
              function_name:record.topic.name,
              function_alias: alias,
              function_description:record.topic.description
              };
          })
          return allResults; 
        }).catch(function(err){
          console.log(err.message);
        });
      },
      orderedFindByTopicsAndPackages:function(topics,packageNames){
        return Topic.findAll({
          attributes:['id','name','description'],
          include:[{
            model:PackageVersion,
            as:'package_version',
            required:true,
            attributes:['package_name','id'],
            include:[{
              model:Package,
              as:'package_latest',
              required:true,
              attributes:['latest_version_id'],
              include:[{
                model:DownloadStatistic,
                as:'last_month_stats',
                required:false,
                attributes:[],
                where:{date :{
                  $gte: new Date(new Date() - 30*24 * 60 * 60 * 1000)
                }}
              }],
            }],
            where:{
              package_name:{
                $in:packageNames
              }
            }
          }],
          where:{
            name:{
              $in:topics
            }
          },
          group:['name','package_version.id','id','package_version.package_latest.name'],
          order:[sequelize.fn('SUM', sequelize.col('package_version.package_latest.last_month_stats.direct_downloads'))]
        }).then(function(data){
          allResults= _.map(data,function(record){
            return Alias.findAll({
              where: {topic_id:record.id}
            }).then(function(aliases){
              alias = (aliases != null && aliases.length > 0)? aliases[0].name : "";
              return {
                id:record.id,
                package_name:record.package_version.package_name,
                function_name:record.name,
                function_alias:alias,
                function_description:record.description
              };
            })
            .catch(function(err){
              console.log(err.message);
            })
          })
          return Promise.all(allResults).then(function(results){
            return results;
          });
        }).catch(function(err){
          console.log(err.message);
        });
      }
    }
  }
};

