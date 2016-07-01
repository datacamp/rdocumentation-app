# rdocumentation.org
The web application running [rdocumentation.org](http://www.rdocumentation.org).

##Installation
###Using docker
- Install the docker toolbox
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
then add your code to
  - `./migrations/{time}{migration_name}.js`
  - `./migrations/sqls/{time}{migration_name}.sql`
  - `./migrations/sqls/{time}{migration_name}.sql`

###Without docker
Run `NODE_ENV=development node node_modules/db-migrate/bin/db-migrate create migration_name`
then add your code to
  - `./migrations/{time}{migration_name}.js`
  - `./migrations/sqls/{time}{migration_name}.sql`
  - `./migrations/sqls/{time}{migration_name}.sql`


## Deployement

Prerequisites:
 - docker
 - awsebcli
 - npm

You have to have your repository configured with eb to be able to deploy. See
http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-configuration.html to configure your eb.

When your repo is clean and you're on the branch corresponding to the environment you want to deploy, run
```
./deploy.sh major|minor|patch
```
to bump version number, build docker image, upload it, and create version commit and tag on git.

The major, minor or patch argument will bump version number accordingly.

When this is done, run
```
eb deploy env-name
```
to deploy to elasticbeanstalk

## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).
