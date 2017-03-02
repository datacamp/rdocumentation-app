FROM node:7.6

MAINTAINER Ludovic Vannoorenberghe <ludo@datacamp.com>

RUN apt-get update && apt-get install -y python build-essential

RUN npm install -g pm2 node-gyp sails grunt bower jake npm-check-updates

ENV NODE_ENV production
# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
ADD package.json /tmp/package.json
RUN cd /tmp && npm cache clean && rm -rf node_modules && npm install --unsafe-perm --production
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

# From here we load our application's code in, therefore the previous docker
# "layer" thats been cached will be used if possible
WORKDIR /opt/app
ADD . /opt/app

# Define mountable directories.
VOLUME ["/opt/app"]

#Expose port
EXPOSE 1337

CMD ["npm", "start"]
