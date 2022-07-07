FROM node:8.16

RUN apt-get update && apt-get install -y python build-essential

RUN npm install -g pm2 node-gyp sails grunt bower jake npm-check-updates

ARG VERSION
ENV VERSION=${VERSION}

ENV NODE_ENV production

# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
ADD package.json /tmp/package.json
ADD package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm install --unsafe-perm --production
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

# From here we load our application's code in, therefore the previous docker
# "layer" thats been cached will be used if possible
WORKDIR /opt/app
ADD . /opt/app

#Expose port
EXPOSE 3000

CMD bash -c "npm start"
