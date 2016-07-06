
module.exports = {

  connections: {
    sequelize_mysql: {
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      options: {
        dialect: 'mysql',
        host   : process.env.DATABASE_HOST,
        port   : process.env.DATABASE_PORT,
        pool: {
          max: 10,
          min: 3,
          idle: 10000
        }
      }
    },

  },

  models: {
    migrate: 'safe'
  },

  grunt: {
    _hookTimeout: 60000
  },


  session: {
    url: process.env.REDIS_URL,
    prefix: 'sess:'
  },

  routes: {
    'post /tasks': 'WorkerController.processMessage',
    'get /index-stats': 'WorkerController.indexStats'
  }

};
