/**
 * DownloadStatistic.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true
    },

    percentile: {
      type: Sequelize.DOUBLE,
      allowNull: false,
      unique: true
    },

    value: {
      type: Sequelize.INTEGER,
      allowNull: false
    }

  },


  options: {
    underscored: true
  }
};
