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

    last_month_downloads: {
      type: Sequelize.INTEGER,
      allowNull: false
    },

    last_month_downloads_direct: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    last_month_downloads_indirect: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    date: {
      type: Sequelize.DATE,
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
    underscored: true
  }
};

