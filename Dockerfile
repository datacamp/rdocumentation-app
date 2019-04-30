FROM node:8.16

MAINTAINER Ludovic Vannoorenberghe <ludo@datacamp.com>

RUN apt-get update && apt-get install -y python build-essential

# aws env
RUN curl -o /tmp/aws-env-linux-amd64 -L https://github.com/datacamp/aws-env/releases/download/v0.1-session-fix/aws-env-linux-amd64 && \
  chmod +x /tmp/aws-env-linux-amd64 && \
  mv /tmp/aws-env-linux-amd64 /bin/aws-env

RUN npm install -g pm2 node-gyp sails grunt bower jake npm-check-updates

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
EXPOSE 1337

CMD bash -c "eval $(aws-env) && npm start"
