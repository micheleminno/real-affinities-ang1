FROM sunnyone/python-node-latest

EXPOSE 3000
ENV NODE_ENV production
RUN mkdir /app
WORKDIR /app


# add package.json and run npm install before adding the rest of the files
# this way, you only run npm install when package.json changes

ADD /web-server/package.json /app/package.json

RUN npm install -g mocha
RUN npm install natural
RUN npm install

# add the rest of the files
ADD . /app

CMD ["node", "server/Server.js"]
