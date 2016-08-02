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
      query = "SELECT SUM(direct_downloads) AS direct_downloads,aka.name AS alias,t.id,t.name,t.description,t.package_version_id,pv.package_name FROM Aliases aka,Topics t,PackageVersions pv,DownloadStatistics d WHERE d.package_name = pv.package_name AND aka.topic_id=t.id AND t.package_version_id=pv.id AND d.date >= current_date() - interval '1' month AND aka.name = ? ";
      query = query.concat(" GROUP BY t.name ,t.package_version_id,t.id,aka.name ORDER BY SUM(direct_downloads) DESC;");
      return sequelize.query(query,
        { replacements: [alias], type: sequelize.QueryTypes.SELECT}).then(function(data){
            allResults = _.map(data,function(record){
              return {
              id:record.id,
              package_name:record.package_name,
              function_name:record.name,
              function_alias:record.alias,
              function_description:record.description
              };
          })
          return allResults; 
       }).catch(function(err){
        console.log(err.message);
      });
    },
    orderedFindByTopicsAndPackages:function(topics,packageNames){
      query = "SELECT SUM(direct_downloads) AS direct_downloads,aka.name AS alias,t.id,t.name,t.description,t.package_version_id,pv.package_name FROM Aliases aka,Topics t,PackageVersions pv,DownloadStatistics d WHERE d.package_name = pv.package_name AND aka.topic_id=t.id AND t.package_version_id=pv.id AND d.date >= current_date() - interval '1' month AND t.name IN(";
      for(var i=0;i<packageNames.length-1;i++){
          query = query.concat("?,");
      }
      query = query.concat("?) AND pv.package_name IN (")
      for(var i=0;i<packageNames.length-1;i++){
        query = query.concat("?,");
      }
      query = query.concat("?)");
      var replace = topics.concat(packageNames);
      query = query.concat(" GROUP BY t.name ,t.package_version_id,t.id,aka.name ORDER BY SUM(direct_downloads) DESC;");
      return sequelize.query(query,
        { replacements: replace, type: sequelize.QueryTypes.SELECT}).then(function(data){
            allResults = _.map(data,function(record){
              return {
              id:record.id,
              package_name:record.package_name,
              function_name:record.name,
              function_alias:record.alias,
              function_description:record.description
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

