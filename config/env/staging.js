/**
 * Staging environment settings
 *
 * This file can include shared settings for a staging environment,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

console.log(process.env.DATABASE_URL);
module.exports = {

  connections: {
    sequelize_mysql: {
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USERNAME,
      password: process.env.PASSWORD,
      options: {
        dialect: 'mysql',
        host   : process.env.DATABASE_HOST,
        port   : process.env.DATABASE_PORT
      }
    }
  },

  models: {
    migrate: 'drop'
  }


};
