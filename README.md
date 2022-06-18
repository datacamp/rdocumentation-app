# RDocumentation API

_Note:_ This repo is now only used for its API. Please disregard all the UI code here, which now lives in [datacamp/rdocumentation-2.0](https://github.com/datacamp/rdocumentation-2.0).

rdocumentation.org provides the R community with centralized, quality and easy to search documentation.

R documentation sifts through all CRAN, GitHub and BioConductor packages hourly, parses the documentation files and indexes them in an Elasticsearch database. This makes rdocumentation.org the best online resource to browse all R package documentation.

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

## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).
