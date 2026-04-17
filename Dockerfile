# install dependencies using a builder (for security) and by using node:lts (as it includes compilers)
FROM node:lts AS builder

# use pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# set the directory for this builder
WORKDIR /build

# copy configuration files and install packages
COPY ./pnpm-lock.yaml ./pnpm-workspace.yaml ./package.json ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts


# app's final image
FROM node:lts-slim

# set the directory for this app and change its permissions
WORKDIR /home/node/flooded-area-moderation/
RUN chown -R node:node /home/node/flooded-area-moderation/

# change user
USER node

# copy packages from the builder
COPY --from=builder --chown=node:node /build/node_modules/ ./node_modules/

# copy the rest of the files and change its permissions
COPY --chown=node:node ./ ./

# start the app
CMD ["npm", "start", "--", "--color"]