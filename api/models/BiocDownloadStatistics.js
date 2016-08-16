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
    ]
  }
};

