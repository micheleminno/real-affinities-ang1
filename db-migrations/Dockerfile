FROM node:8.1.4-alpine

WORKDIR /app

# add package.json and run npm install before adding the rest of the files
# this way, you only run npm install when package.json changes
ADD package.json /app
RUN npm install

# add the rest of the files
ADD . /app

ENV NODE_ENV production
CMD ["./node_modules/.bin/knex", "migrate:latest"]


# execute migrations
# docker run --net realaffinities_default --rm micheleminno/db-migrations
