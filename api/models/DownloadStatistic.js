/**
 * DownloadStatistic.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

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
      }
    }
  }
};

