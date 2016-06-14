/**
 * Review.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    rating: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 }
    },

    title: {
      type: Sequelize.STRING,
      allowNull: true
    },

    text: {
      type: Sequelize.TEXT,
      allowNull: true
    },

    reviewable: Sequelize.STRING,

    reviewable_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },

    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  },

  associations: function() {
    Review.belongsTo(PackageVersion, {
      foreignKey: 'reviewable_id',
      constraints: false,
      as: 'package_version'
    });

    Review.belongsTo(Topic, {
      foreignKey: 'reviewable_id',
      constraints: false,
      as: 'topic'
    });

    Review.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  },

  options: {
    underscored: true
  }
};

