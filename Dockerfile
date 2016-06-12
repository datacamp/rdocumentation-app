FROM node:slim

MAINTAINER Ludovic Vannoorenberghe <ludo@datacamp.com>

RUN apt-get update && apt-get install -y python build-essential

RUN npm install -g node-gyp sails grunt bower npm-check-updates
RUN mkdir /server

# Define mountable directories.
VOLUME ["/server"]

# Define working directory.
WORKDIR /server

# Expose ports.
EXPOSE 1337
