/**
 * TaskView.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },

    url: {
      type: Sequelize.STRING,
      allowNull: false
    }

  },
  associations: function() {

    TaskView.belongsToMany(Package,
      {
        as: 'packages',
        through: 'TaskViewPackages',
        foreignKey: 'task_id',
        timestamps: false
    });
  },

  options: {
    underscored: true
  }
};

