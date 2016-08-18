/**
 * BiocDownloadStatistic.js
 *
 * @description :: downloadstatistics for the bioconductor packages
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    package_name: {
      type: Sequelize.STRING,
      allowNull: false
    },

    date: {
      type: Sequelize.DATE,
      allowNull: false
    },

    distinct_ips: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    downloads: {
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
    classMethods:{
      lastYearsSplittedDownloadsPerMonth:function(package_name,years){
        return BiocDownloadStatistics.findAll({
          where:{
            package_name:package_name,
            date:{
              $gte:new Date(new Date()-years*365*24*60*60*1000),
              $lt:new Date()
            }
          },
        });
      },
      getMonthlySplittedDownloads:function(package_name){
        return BiocDownloadStatistics.findAll({
          where:{
            package_name:package_name,
            date:{
              $gte: sequelize.literal("current_date() - interval '1' month")
            }
          },
        });
      }
    }
  }
};

