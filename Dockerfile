FROM node:12-alpine

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin


RUN npm i -g pnpm

# copy npm files and install packages so only package.json changes cause a full
# package reinstall
COPY ./package*.json /srv/
WORKDIR /srv
# TODO: use multi-stage builds to strip out dev dependencies
# or move build tools into production dependencies
RUN pnpm i

# copy build
COPY . /srv

EXPOSE 3000/tcp

ENTRYPOINT [ "pnpm", "start" ]
CMD []