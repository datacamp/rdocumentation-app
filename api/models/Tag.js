/**
 * Tag.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    }

  },

  associations: function() {
    Tag.belongsToMany(Topic, { as: 'tags', foreignKey: 'tag_id', through: 'TopicTags', timestamps: false});
  },

  options: {
    underscored: true,
    timestamps: false
  }
};

