/**
 * Alias.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
_ = require('lodash');
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
              attributes:['package_name'],
              include:[{
                model:Package,
                as:'package',
                required:true,
                attributes:[],
                include:[{
                  model:DownloadStatistic,
                  as:'last_month_stats',
                  required:true,
                  attributes:[],
                  where:{date :{
                    $gte: new Date(new Date() - 30*24 * 60 * 60 * 1000)
                  }}
                }],
                where:{latest_version_id:Sequelize.col('topic.package_version.id')}
              }]
            }]
          }],
          where:{name:alias},
          group:['topic.name','topic.package_version.id','topic.id','Alias.name','Alias.id'],
          order:[sequelize.fn('SUM', sequelize.col('topic.package_version.package.last_month_stats.direct_downloads'))]
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
        return Alias.findAll({
          attributes: ['id',['name','alias']],
          include:[{
            model:Topic,
            as:'topic',
            attributes:['id','name','description'],
            include:[{
              model:PackageVersion,
              as:'package_version',
              attributes:['package_name'],
              include:[{
                model:Package,
                as:'package',
                required:true,
                attributes:[],
                include:[{
                  model:DownloadStatistic,
                  as:'last_month_stats',
                  required:true,
                  attributes:[],
                  where:{date :{
                    $gte: new Date(new Date() - 30*24 * 60 * 60 * 1000)
                  }}
                }],
                where:{
                  latest_version_id:Sequelize.col('topic.package_version.id'),
                }
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
            }
          }],
          group:['topic.name','topic.package_version.id','topic.id','Alias.name','Alias.id'],
          order:[sequelize.fn('SUM', sequelize.col('topic.package_version.package.last_month_stats.direct_downloads'))]
        }).then(function(data){
            allResults = _.map(data,function(record){
              return {
              id:record.topic.id,
              package_name:record.topic.package_version.package_name,
              function_name:record.topic.name,
              function_alias: record.dataValues.alias,
              function_description:record.topic.description
              };
          })
          return allResults; 
        }).catch(function(err){
          console.log(err.message);
        });
      }
    }
  }
};

