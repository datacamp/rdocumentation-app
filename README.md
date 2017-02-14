![rdocumentation_site_banner](https://cloud.githubusercontent.com/assets/1741726/17966806/d52c646a-6ac3-11e6-8f61-60379cfd70bb.png)

rdocumentation.org provides the R community with centralized, quality and easy to search documentation.

R documentation sifts through all CRAN, GitHub and BioConductor packages hourly, parses the documentation files and indexes them in an Elasticsearch database. This makes rdocumentation.org the best online resource to browse all R package documentation.

The RDocs project is completely open-source. This repository contains the source code for the NodeJS web application that serves [www.rdocumentation.org](https://www.rdocumentation.org). For other codebases, you can check out [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Features
- Quick search through all packages and functions 
  
![screen shot 2016-08-25 at 14 07 05](https://cloud.githubusercontent.com/assets/1741726/17968459/41bee176-6acd-11e6-9431-3aec36ffd8c8.png)
  
- Complete search through all packages and function
  
![screen shot 2016-08-25 at 14 08 52](https://cloud.githubusercontent.com/assets/1741726/17968498/7ce9a6aa-6acd-11e6-9276-4d5ced4523b3.png)
  
- Easily assess package quality

![screen shot 2016-08-25 at 14 11 27](https://cloud.githubusercontent.com/assets/1741726/17968583/df47301a-6acd-11e6-9a28-5167b768fbf1.png)

- Post *community examples* to help the community understand how to use a function

![screen shot 2016-08-25 at 14 14 37](https://cloud.githubusercontent.com/assets/1741726/17968654/492bb8f2-6ace-11e6-8a64-c620e9e98efa.png)

## API

DataCamp encourages the reuse of the data from rdocumentation.org, a public API is available. More info at http://www.rdocumentation.org/docs/

## Issue/Feature request
Please post a new issue at https://github.com/datacamp/rdocumentation-app/issues for any bug that you encounter or a feature that you would like to see in rdocumetation.org.

## Development

### Using docker
- Install the docker toolbox
- `docker-compose build` to build your local docker image
- Execute `docker-compose run server npm install --no-bin-links` to install npm dependencies.
- Run the database migrations by doing `docker-compose run server node node_modules/db-migrate/bin/db-migrate up`.
- `docker-compose up`

### Without docker
- Install MySQL and Node.js on your system
- Run `npm install`
- Create an empty database `rdocsv2`
- Execute the migrations: `NODE_ENV=development node node_modules/db-migrate/bin/db-migrate up`
- `node app.js` (or if you have nodemon installed: `nodemon app.js`)


## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).
