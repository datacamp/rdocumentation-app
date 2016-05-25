FROM node:slim

MAINTAINER Ludovic Vannoorenberghe <ludo@datacamp.com>

RUN npm install -g sails grunt bower npm-check-updates
RUN mkdir /server

# Define mountable directories.
VOLUME ["/server"]

# Define working directory.
WORKDIR /server

# Expose ports.
EXPOSE 1337