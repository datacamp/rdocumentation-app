#!/bin/bash
set -e

if [ -n "$(git status --porcelain)" ]; then
  echo "Your git directory is not clean, commit your changes before building";
  exit 1;
fi

#bump version
version=$(npm version $1)

#build new docker image
docker build -t dockerhub.datacamp.com/rdocsv2:$version .
#push image to docker registery
docker push dockerhub.datacamp.com/rdocsv2:$version

#push to git
git push --follow-tags

sed "s/\$version/$version/" < Dockerrun.aws.json.in > Dockerrun.aws.json
