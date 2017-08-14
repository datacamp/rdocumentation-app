/**
 * ParsingJob.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    package_name: {
      type: Sequelize.STRING,
      allowNull: false
    },

    package_version: {
      type: Sequelize.STRING,
      allowNull: false
    },

    parser_version: {
      type: Sequelize.INTEGER
    },

    parsed_at: {
      type: Sequelize.DATE,
      allowNull: false
    },

    parsing_status: {
      type: Sequelize.TEXT,
      allowNull: false
    },

    error: {
      type: Sequelize.TEXT,
    },

  },
  options: {
    indexes: [
      {
        type: 'UNIQUE',
        fields: ['package_name', 'package_version']
      }
    ],
    timestamps: false
  },
}
