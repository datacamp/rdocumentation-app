/**
 * Example.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    example: {
      type: Sequelize.TEXT,
      allowNull: false
    }

  },

  associations: function() {

    Example.belongsTo(Topic, {
      foreignKey: 'topic_id',
      as: 'topic'
    });

    Example.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  },


  options: {
    underscored: true
  }
};

