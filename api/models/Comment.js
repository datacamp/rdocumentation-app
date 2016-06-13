/**
 * Comment.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    description: {
      type: Sequelize.TEXT,
      allowNull: false
    },

    commentable: Sequelize.STRING,

    commentable_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },

    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  },

  associations: function() {
    Comment.belongsTo(PackageVersion, {
      foreignKey: 'commentable_id',
      constraints: false,
      as: 'version'
    });

    Comment.belongsTo(Topic, {
      foreignKey: 'commentable_id',
      constraints: false,
      as: 'topic'
    });

    Comment.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  },

  options: {
    underscored: true
  }
};

