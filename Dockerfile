# node.js image
FROM node:lts-slim

# set the directory for this app
WORKDIR /discord/flooded-area-moderation

# copy all package*.json and install packages (so they install within the anonymous container)
COPY package*.json ./
RUN npm install --omit=dev

# copy the rest of the files
COPY . ./