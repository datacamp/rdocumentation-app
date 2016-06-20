# rdocumentation.org
The web application running rdocumentation.org.

##Installation
###Using docker
- Install docker-machine and docker-engine
- `docker-compose build` to build your local docker image
- Execute `docker-compose run server npm install --no-bin-links` to install npm dependencies.
- Run the database migrations by doing `docker-compose run server node node_modules/db-migrate/bin/db-migrate up`.
- `docker-compose up`

###Without docker
- Install MySQL and Node.js on your system
- Run `npm install`
- Create an empty database `rdocsv2`
- Execute the migrations: `NODE_ENV=development node node_modules/db-migrate/bin/db-migrate up`
- `node app.js` (or if you have nodemon installed: `nodemon app.js`)

##Creating a new database migration:
###Using docker
Run `docker-compose run server node node_modules/db-migrate/bin/db-migrate create migration_name`
then populate the files in
  - `./migrations/{time}{migration_name}.js`
  - `./migrations/sqls/{time}{migration_name}.sql`
  - `./migrations/sqls/{time}{migration_name}.sql`

###Without docker
Run `NODE_ENV=development node node_modules/db-migrate/bin/db-migrate create migration_name`
then populate the files in
  - `./migrations/{time}{migration_name}.js`
  - `./migrations/sqls/{time}{migration_name}.sql`
  - `./migrations/sqls/{time}{migration_name}.sql`


## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).