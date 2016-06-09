# rdocumentation-app-2.0

Sails app serving rdocumentation.org

#Installation

Run
```
docker-compose build
```
to build your local docker image


Then
```
docker-compose run server npm install --no-bin-links
```
to install npm dependencies

#Running the server

```
docker-compose up
```

#Creating a new db migration:
Run
```
node node_modules/db-migrate/bin/db-migrate create migration_name
```
then populate the files in
  - `./migrations/{time}{migration_name}.js`
  - `./migrations/sqls/{time}{migration_name}.sql`
  - `./migrations/sqls/{time}{migration_name}.sql`


#Running migrations

```
docker-compose run server node node_modules/db-migrate/bin/db-migrate up
```
