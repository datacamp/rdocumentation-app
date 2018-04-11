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


## What this app does

This application is part the rdocumentation project. This app is responsible for storing the RDocumentation data, and bring it to the users through a web interface (the rdocumentation.org site) or through an api (See https://www.rdocumentation.org/docs/ for the public API)

## Documentation

Documentation of the differents endpoints can be found here: http://www.rdocumentation.org/docs/

## Issue/Feature request
Please post a new issue at https://github.com/datacamp/rdocumentation-app/issues for any bug that you encounter or a feature that you would like to see in rdocumetation.org.

## Development

### Using docker
You'll need docker and docker-compose to run this stack locally

- Copy the .env.sample to .env and change relevant variables
- `docker-compose create` to create the redis and mysql container
- `docker-compose start` to fire up a local redis an mysql
- Run the database migrations by doing `npm run migrate`
- `npm run start-dev`

## How to deploy

- To deploy to stating (rdocumentation.datacamp-staging.com), merge to master
- To deploy to production, add a tag which starts with `release-`

The rdocumentation app is hosted on DataCamp's infrastructure, on our AWS ECS cluster.

## What the CI does

This application runs on the DataCamp infrastructure. Our custom CI flow will:
- Build a docker image
- Upload it the ECR
- Deploy the new version to ECS

## How to contribute

We welcome any contributions that could improves rdocumentation.org. There is multiple ways of contributing:
- Report when some packages are missing/outdated/incorrect by creating an issue.
- Report bugs.
- Help us improves by proposing features.
- Directly contribute by forking the repo and making changes.

## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).
