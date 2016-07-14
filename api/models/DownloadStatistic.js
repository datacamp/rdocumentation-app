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
    classMethods: {
      getMonthlySplittedDownloads :function(package_name){
        return sequelize.query("SELECT SUM(indirect_downloads),SUM(direct_downloads) FROM DownloadStatistics WHERE date >= current_date() - interval '30' day and package_name = :package",{ replacements: { package: package_name }, type: sequelize.QueryTypes.SELECT });
      }
    }
  }
};

