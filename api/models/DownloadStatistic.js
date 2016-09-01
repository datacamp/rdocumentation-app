/**
 * DownloadStatistic.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

 var numeral = require('numeral');

module.exports = {

  attributes: {

    package_name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },

    date: {
      type: Sequelize.DATE,
      allowNull: false
    },

    direct_downloads: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    indirect_downloads: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  },

  associations: function() {
    DownloadStatistic.belongsTo(Package,
      {
        as: 'package',
        foreignKey: {
          allowNull: false,
          name:'package_name',
          as: 'package'
        },
        onDelete: 'CASCADE'
      });
  },


  options: {
    underscored: true,

    indexes: [
      {
        type: 'UNIQUE',
        fields: ['package_name', 'date' ]
      }
    ],

    classMethods: {
      getMonthlySplittedDownloads :function(package_name){
        return sequelize.query("SELECT SUM(indirect_downloads) AS indirect_downloads,SUM(direct_downloads) AS direct_downloads FROM DownloadStatistics WHERE date >= current_date() - interval '1' month and package_name = :package",{ replacements: { package: package_name }, type: sequelize.QueryTypes.SELECT });
      },

      findLastIndexedDay: function() {
        return DownloadStatistic.max('date');
      },
      AllStatsNDaysAgo:function(last_day,nb_days,package_name) {
        return DownloadStatistic.findAll({
          attributes:[[sequelize.fn('SUM', sequelize.col('direct_downloads')),"sum_direct"],[sequelize.fn('SUM', sequelize.col('indirect_downloads')),"sum_indirect"]],
          where:{
            package_name:package_name,
            date:{
              $gte:new Date(new Date(last_day)-nb_days*24*60*60*1000)
            }
          },
          group:["package_name"]
        }).then(function(stats){
          if(stats.length==0) return null;
          return stats[0].dataValues
        })
      },
      lastMonthSplittedDownloadsPerDay:function(package_name){
        return DownloadStatistic.findAll({
          where:{
            package_name:package_name,
            date:{
              $gte:new Date(new Date()-30*24*60*60*1000)
            }
          },
        })
      },
      lastDaysSplittedDownloadsPerDay:function(package_name,days){
        return DownloadStatistic.findAll({
          where:{
            package_name:package_name,
            date:{
              $gte:new Date(new Date()-days*24*60*60*1000)
            }
          },
        });
      },
      getMostPopular: function(){
        return sequelize.query("SELECT package_name, SUM(direct_downloads) AS total FROM DownloadStatistics WHERE date >= current_date() - interval '1' month group by package_name order by total DESC limit 0,10",{type:sequelize.QueryTypes.SELECT});
      },
      getMostPopularPerPage: function(page){
        return sequelize.query("SELECT package_name, SUM(direct_downloads) AS total FROM DownloadStatistics WHERE date >= current_date() - interval '1' month group by package_name order by total DESC limit ?,10",{replacements: [(page-1)*10], type:sequelize.QueryTypes.SELECT}).then(function(result){
          var mapped = _.map(result,function(o){
            o.totalStr = numeral(o.total).format('0,0');
            return o;
          });
          return mapped;
        });
      },
      getNumberOfDirectDownloads: function(name){
        return sequelize.query("SELECT SUM(direct_downloads) AS total FROM Packages p INNER JOIN PackageVersions v ON p.latest_version_id = v.id INNER JOIN DownloadStatistics s ON s.package_name = p.name INNER JOIN Collaborators c ON v.maintainer_id = c.id WHERE c.name = ? and s.date >= current_date() - interval '1' month",{  replacements: [name], type: sequelize.QueryTypes.SELECT});
      }
    }
  }
};
