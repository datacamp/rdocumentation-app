/**
 * ApiToken.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    token: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },

    can_create: {
      type: Sequelize.BOOLEAN,
      allowNull: false
    },

    can_update: {
      type: Sequelize.BOOLEAN,
      allowNull: false
    },

    can_delete: {
      type: Sequelize.BOOLEAN,
      allowNull: false
    }

  },

  options: {
    underscored: true,
    timestamps: false
  }
};

