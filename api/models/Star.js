module.exports = {



  attributes: {

    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },

    package_name: {
      type: Sequelize.STRING,
      allowNull: false
    }

  },


  associations: function() {

  },

  options: {
    underscored: true
  }


};
