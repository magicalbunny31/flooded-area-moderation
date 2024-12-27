# 🤖 flooded-area-moderation "the killer 🤖"

- a discord app used for managing roblox bans, using the roblox apis
- made primarily for [flooded area community](https://discord.com/servers/flooded-area-community-977254354589462618)


## 🏡 what is "the killer 🤖"?

- **the killer 🤖** (code name "`flooded-area-moderation`") is a discord app which manages roblox bans
- here are the following tools that are used:
   - [discord.js](https://discord.js.org/)
   - [google cloud firestore](https://cloud.google.com/firestore)
   - [roblox's open cloud api](https://create.roblox.com/docs/cloud/open-cloud)
   - [roblox's legacy api](https://create.roblox.com/docs/en-us/cloud/legacy)
   - [bloxlink's developer api](https://blox.link/dashboard/user/developer)
   - ..[and the lovely dependencies](./package.json#L26-L43)
- *for more information, please see [nuzzles.dev/dev/flooded-area-moderation](https://nuzzles.dev/dev/flooded-area-moderation)*


## 💻 setup

> [!NOTE]
> usage of the [`Jenkinsfile`](Jenkinsfile) is completely optional and can be deleted if not needed

1. `install your environment`
   - have [node.js](https://nodejs.org) >18.0.0 installed
2. `clone the repository`
   - got [`git`](https://git-scm.com/) installed? open your terminal in a folder and run `git clone https://github.com/magicalbunny31/flooded-area-moderation.git`
   - for more help, see [github's docs for help on how to clone a repository](https://docs.github.com/repositories/creating-and-managing-repositories/cloning-a-repository)
3. `set-up the database`
   - the app pretty much relies on [google cloud firestore](https://cloud.google.com/firestore) to function, so let me hold your paw as we set it up together~
   - [create a google cloud project](https://developers.google.com/workspace/guides/create-project) if you haven't already
      - linking a billing account is optional (see below)
   - [create a firestore database](https://console.cloud.google.com/firestore/create-database)
      - create the database in native mode
      - by naming the "Database ID" "`(default)`", it counts under [firestore's free quota](https://cloud.google.com/firestore/pricing#free-quota)!
         - ..meaning, you don't pay for this (as long as you stay under the generous free quota limit, else the app will stop working until the quota resets..)
      - which location you wanna create your database in is up to you - it doesn't really matter but just remember that you can't change it after creating the database
      - you must name the `databaseId` in [`./src/index.js`](./src/index.js#L81) (line 81) the same as the "Database ID" for this newly created database
   - [create a service account for your google cloud project](https://cloud.google.com/iam/docs/service-accounts-create) if you haven't already
      - when granting the service account permissions, give it "Cloud Datastore User" so that it is able to access the database
   - click on your newly created service account and go on the "KEYS" tab
      - under "ADD KEY", select "Create new key"
      - a json file will be downloaded to your device!
      - open the json file: you'll need it for step 6
4. get your [roblox open cloud] api keys
   - [create an api key](https://create.roblox.com/dashboard/credentials) by pressing the "Create API Key" button
   - name it anything you want
   - under "Access Permissions", give it the following scopes:
      - `user-restrictions`
      - select the roblox experiences you wish this app to access
         - don't see the roblox experience you want? you may lack the "**Open Cloud** Create community API keys" permission on your roblox experience's community (formerly known as "group") role
         - ask a person with the "**Members** Manage lower-ranked member ranks" permission on your roblox experience's community role to grant the "**Open Cloud** Create community API keys" permission to your roblox experience's community role..
         - ..or ask a person with these permissions to create the api key for you
      - add the `read` operation under "Experience Operations" (`universe.user-restriction:read`)
      - add the `write` operation under "Experience Operations" (`universe.user-restriction:write`)
   - under "Security", add `0.0.0.0/0` to the "Accepted IP Addresses"
      - feelin' advanced? you can specify your own ip addresses if you prefer
      - ..but i recommend to **NOT** do that unless you really really **REALLY** know what you're doing~
   - under "Security", set "Expiration" to "No Expiration"
   - press "Save & Generate Key"
   - save the generated api key: you'll need it for step 6
5. get your [bloxlink developer api](https://blox.link/dashboard/user/developer) keys
   - you can create an api key per discord guild on the [bloxlink developer api](https://blox.link/dashboard/user/developer) dashboard
   - save the generated api key: you'll need it for step 6
6. `environment variables`
   - input values into [`./src/.env.sample`](./src/.env.sample) according to their keys
   - rename [`./src/.env.sample`](./src/.env.sample) to `.env`
   - [google cloud firestore](https://cloud.google.com/firestore) api keys
      - `GCP_PROJECT_ID`: the `project_id`'s value in the downloaded json file from step 3
      - `GCP_CLIENT_EMAIL`: the `client_email`'s value in the downloaded json file from step 3
      - `GCP_PRIVATE_KEY`: the `private_key`'s value in the downloaded json file from step 3
   - [roblox open cloud](https://create.roblox.com/docs/cloud/open-cloud) api keys
      - replace any occurrences of `<UNIVERSE_ID>` in the keys (with `ROBLOX_OPEN_CLOUD_API_KEY_` prefixes) with your roblox experience's own universe id: this can be repeated as many times as necessary for multiple roblox universes
      - for these `<UNIVERSE_ID>`s, set its value as the api key from step 4
   - [bloxlink developer api](https://blox.link/dashboard/user/developer) keys
      - replace any occurrences of `<GUILD_ID>` in the keys (with `BLOXLINK_SERVER_KEY_` prefixes) with your roblox experience's linked discord guilds: for every roblox universe managed there must be at most one linked discord guild
      - for these `<GUILD_ID>`s, set its value as the api key from step 5
      - this isn't actually required, so if don't want to use the [bloxlink developer api](https://blox.link/dashboard/user/developer) (for some or all discord guilds) then you can skip this
   - [discord webhook urls](https://support.discord.com/hc/articles/228383668)
      - replace any occurrences of `<GUILD_ID>` in the keys (with `LOGS_WEBHOOK_URL_` prefixes) with webhook urls of where to post the moderation log embed for player moderations in the server where the commands are ran in
      - for help on how to create webhooks in a discord channel, see [discord's help centre article on intro to webhooks](https://support.discord.com/hc/articles/228383668)
7. `disable @magicalbunny31/fennec-utilities functionality`
   - [@magicalbunny31/fennec-utilities](https://github.com/magicalbunny31/fennec-utilities) is my own development package for my apps
      - you may start getting errors logged in your console saying "`🚫 FennecClient.initialise() not run yet`", however these are safe to ignore
      - *for more information, please see [nuzzles.dev/dev/fennec](https://nuzzles.dev/dev/fennec)*
   - open [`./src/index.js`](./src/index.js) and locate the line containing: "`await client.fennec.initialise();`"
   - delete this line or comment out this line by prepending `//` to it
8. `configuration files`
   - these files are kinda like environment variables, however they aren't important enough to stay hidden
   - edit the following files and input your own values:
      - ~~[`./src/data/developers.js`](./src/data/developers.js)~~
         - the `developers` export variable is only used for [@magicalbunny31/fennec-utilities](https://github.com/magicalbunny31/fennec-utilities)
         - since you (assumedly) disabled it in step 7, this file is now redundant~
         - ..don't delete it though, you will come across import errors regardless
      - [`./src/data/discord.js`](./src/data/discord.js)
         - the default export for this file is a list of objects that are defined in this file
            - the schema for each object will follow the format as the `FloodedAreaCommunity` variable in this file
         - i recommend replacing values in the `FloodedAreaCommunity` with your own to suit your community
            - don't forget to rename your `process.env.LOGS_WEBHOOK_URL_<GUILD_ID>` environment variables!
            - the reason why these individual variables are exported are because they are imported in [`./src/data/experiences.js`](./src/data/experiences.js)
            - this means that, if you are planning on renaming, adding, or removing these objects then it must be reflected in [`./src/data/experiences.js`](./src/data/experiences.js) too
      - [`./src/data/experiences.js`](./src/data/experiences.js)
         - the default export for this file is a list of objects that are defined in this file
            - the schema for each object will follow the format as the `FloodedArea` variable in this file
         - i recommend replacing values in the `FloodedArea` with your own to suit your community
            - don't forget to rename your `process.env.ROBLOX_OPEN_CLOUD_API_KEY_<UNIVERSE_ID>` (and optionally `process.env.BLOXLINK_SERVER_KEY_<GUILD_ID>`) environment variables!
      - [`./src/data/user-agent.js`](./src/data/user-agent.js)
         - the default export for this file returns a formatted `User-Agent` string for http requests (to apis)
         - this is generated from [`./package.json`](./package.json) and is formatted to look like this:
            - "**`<package.json name>`**`/`**`<package.json version>`**` (`**`package.json homepage`**`)`"
         - if you need to change the `User-Agent` string manually, you must replace the default export with your own string~
9. `dependencies`
   - open the command line inside the repository's main directory
   - run the command `npm install`
10. `start the app`
   - prefer using [`pm2`](https://pm2.io/)?
      - run the command `npm start`
      - *for more information on how to configure [`pm2`](https://pm2.io/) to your liking, see [pm2.io/docs/plus/overview](https://pm2.io/docs/plus/overview/)*
   - just wanna start the app from the terminal instantly?
      - run the command `npm run dev`


## 🗃️ previous versions

- 🏚️ ~~[v1](https://github.com/magicalbunny31/flooded-area-moderation/tree/v1)~~
- 🏚️ ~~[v2](https://github.com/magicalbunny31/flooded-area-moderation/tree/v2)~~
- 🏡 **v3** (this branch!)


## 📚 license ([MIT](./license))

- see [`license`](./license)~ ✨
- please note that the [`license`](./license) only applies to **v3** (this branch) 


## contributors 👥
- 🦊 [@magicalbunny31](https://github.com/magicalbunny31) ([nuzzles.dev](https://nuzzles.dev))