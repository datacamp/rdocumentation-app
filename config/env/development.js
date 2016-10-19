/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  /***************************************************************************
   * Set the default database connection for models in the development       *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/
   connections: {
    sequelize_mysql: {
      database: 'rdocsv2',
      user: 'root',
      password: '',
      options: {
        dialect: 'mysql',
        host   : '127.0.0.1',
        port   : 3306,
        pool: {
          max: 10,
          min: 4,
          idle: 10000
        }
      }
    }
  },

  models: {
    migrate: 'safe'
  },

  session: {
    secret: '652c68f88144e6a99b9522ea1193a645'
  },

  redis: {

    logging: true,

    url: 'redis://localhost:6379'

  },

  cors: {
    allRoutes: true,

    origin: '*',

    credentials: true,

    exposeHeaders: 'X-RStudio-Ajax, X-RStudio-Redirect, X-Rstudio-Session',

    methods: 'GET, POST, PUT, DELETE, OPTIONS, HEAD',

    headers: 'Content-Type, Accept-Encoding, X-Shared-Secret, X-Requested-With, Cache-Control, X-RStudio-Ajax, X-RStudio-Redirect, X-Rstudio-Session'
  }

};
