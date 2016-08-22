module.exports = {



  attributes: {

    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    package_name: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true
    }

  },


  associations: function() {

  },

  options: {
    underscored: true
  }


};
