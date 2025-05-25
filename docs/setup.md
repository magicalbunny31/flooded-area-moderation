# 💻 setup

- interested in hosting your own `flooded-area-moderation` for your own roblox experiences and discord guilds? read on!
- hosting this app assumes you have very basic knowledge of javascript (node.js)


## ‼️ important information

- according to the license ([MIT](../license)), the code provided in this repository is provided "as is", without any warranty, and the [contributors](https://github.com/magicalbunny31/flooded-area-moderation/graphs/contributors) are not liable for any claims or damages arising from its use
   - you, the person hosting this app, are responsible for all its actions and the consequences generated from it as a result
- the [Flooded Area](https://www.roblox.com/games/3976767347/Flooded-Area) branding (from roblox) included within this repository are copyrighted and are not included in the license ([MIT](../license)): you can't use them under the same terms!
   - you are permitted to host an unmodified version of this instance as long as you insure it remains private and not accessible in any way to the public
      - **private instance examples**: a discord guild restricted to a small group of members (like a small team of developers) and not intended for public discovery
      - **public instance examples**: a discord guild marked as a community server, intended for public discovery
   - if your discord guild doesn't match the **private instance examples**, please remove or replace all branding! this includes but is not limited to:
      - any references to [Flooded Area](https://www.roblox.com/games/3976767347/Flooded-Area) (excluding variable names)
      - the embed colours (aka: container accent colours) of the app, seen in the code as [`colours.flooded_area_moderation`](https://github.com/magicalbunny31/pawesome-utility-stuffs/blob/main/src/data/colours.js#L30) or hex colour `#bc1922`


## 📋 the actual instructions

1. install your environment
   - have [node.js](https://nodejs.org) >22.12.0 (and a recent release of [npm](https://www.npmjs.com/)) installed
2. clone the repository
   - got [`git`](https://git-scm.com/) installed? open your terminal in a folder and run `git clone https://github.com/magicalbunny31/flooded-area-moderation.git`
   - for more help, see [github's docs for help on how to clone a repository](https://docs.github.com/repositories/creating-and-managing-repositories/cloning-a-repository)
3. disable [@magicalbunny31/fennec-utilities](https://github.com/magicalbunny31/fennec-utilities) functionality
   - [@magicalbunny31/fennec-utilities](https://github.com/magicalbunny31/fennec-utilities) is my own development package for my apps
      - you may start getting errors logged in your console saying "`🚫 FennecClient.initialise() not run yet`", however these are safe to ignore
      - *for more information, please see [nuzzles.dev/dev/fennec](https://nuzzles.dev/dev/fennec)*
   - open [`./src/index.js`](../src/index.js) and locate the line containing: "`await client.fennec.initialise();`"
   - delete this line or comment out this line by prepending `//` to it
4. environment variables
   - we'll set up the `.env` file now so that you can insert values into it as you continue along the further steps~
   - rename the [`/src/.env.sample`](../src/.env.sample) file to `.env`
   - further steps will reference this file as the `.env` file to input values in
   - once you finish following all steps, if there are any keys you didn't input values in (for example: if you don't input [google cloud firestore](https://cloud.google.com/firestore) api keys because you're using [node.js native sqlite](https://nodejs.org/api/sqlite.html) in step 4) then it is safe to leave these keys empty or even delete these keys from the `.env` file
5. set-up the database
   - the app supports two database structures: [google cloud firestore](https://cloud.google.com/firestore) and [node.js native sqlite](https://nodejs.org/api/sqlite.html)
   - whilst [google cloud firestore](https://cloud.google.com/firestore) more complex to configure, it can be easier to manage
      - for instructions on setting up [google cloud firestore](https://cloud.google.com/firestore), see **[the docs here](./setup-firestore.md)**
   - though, [node.js native sqlite](https://nodejs.org/api/sqlite.html) was added as an alternative for those who want to fully self-host the app
      - when choosing [node.js native sqlite](https://nodejs.org/api/sqlite.html), exercise extreme caution with your local database file (which will be generated in [`src/database/sqlite.db`](../src/database/sqlite.db))! make sure it doesn't accidentally get committed, deleted, compromised, or something along those lines~
      - for instructions on setting up [node.js native sqlite](https://nodejs.org/api/sqlite.html), see **[the docs here](./setup-sqlitemd)**
6. get your [roblox open cloud](https://create.roblox.com/docs/cloud/open-cloud) api keys
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
      - be aware that, even if this value is set to "No Expiration", if this api key isn't used (which may occur if the app doesn't moderate anyone) or updated within 60 days, the api key will automatically expire
      - in the event that the api key does expire, you'll need to rotate it from the same [creator dashboard](https://create.roblox.com/dashboard/credentials)
      - for more information, see [roblox's documentation on regarding this topic](https://create.roblox.com/docs/cloud/auth/api-keys#api-key-status)
   - press "Save & Generate Key"
   - save the generated api key: you'll need it to input values into your `.env` file
      - replace any occurrences of `<UNIVERSE_ID>` in the keys (with `ROBLOX_OPEN_CLOUD_API_KEY_` prefixes) with your roblox experience's own universe id: this can be repeated as many times as necessary for multiple roblox universes
         - you'll need to reference these `.env` values inside the [`/src/data/config.js`](../src/data/config.js) file (see step 9)
      - for these `<UNIVERSE_ID>`s, set its value as the api key you generated
7. get your [bloxlink developer api](https://blox.link/dashboard/user/developer) keys
   - *this step is optional: if you prefer to not obtain [bloxlink developer api](https://blox.link/dashboard/user/developer) keys, you can skip this step*
   - you can create an api key per discord guild on the [bloxlink developer api](https://blox.link/dashboard/user/developer) dashboard
   - save the generated api key: you'll need it to input values into your `.env` file
      - replace any occurrences of `<GUILD_ID>` in the keys (with `BLOXLINK_SERVER_KEY_` prefixes) with your roblox experience's linked discord guilds: for every roblox universe managed there must be at most one linked discord guild
      - for these `<GUILD_ID>`s, set its value as the api key for its corresponding discord guild
         - you'll need to reference these `.env` values inside the [`/src/data/config.js`](../src/data/config.js) file (see step 9)
8. add [discord webhook urls](https://support.discord.com/hc/articles/228383668) to your `.env` file
   - replace any occurrences of `<GUILD_ID>` in the keys (with `LOGS_WEBHOOK_URL_` prefixes) with webhook urls created in the channel of where to post the moderation log embed for player moderations (in the guild where the commands are ran in)
      - you'll need to reference these `.env` values inside the [`/src/data/config.js`](../src/data/config.js) file (see step 9)
   - for help on how to create webhooks in a discord channel, see [discord's help centre article on intro to webhooks](https://support.discord.com/hc/articles/228383668)
9. update your discord app from the [discord developer dashboard](https://discord.com/developers/applications) for your app
   - under the "Bot" tab, get your discord app's bot token from the [discord developer dashboard](https://discord.com/developers/applications) to your `.env` file
      - insert it into the value of `TOKEN` near the top of the file
      - for help on where to find your discord app's bot token, see [discord.js' guide on setting up an application](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)
   - under the "Bot" tab, enable the following privileged gateway intents for the app to function:
      - "Server Members Intent"
      - "Message Content Intent"
10. configuration files
   - these files are kinda like environment variables, however they aren't important enough to stay hidden
   - edit the list which is `export default` in [`/src/data/config.js`](../src/data/config.js):
      - one discord guild can only link to one roblox experience - there will be limited support for allowing multiple relationships between multiple discord guilds or roblox experiences
      - for typings on how to format your own entry in this list, see [`/src/types/config.d.ts`](../src/types/config.d.ts)
   - edit the string in [`/src/data/user-agent.js`](../src/data/user-agent.js):
      - the default export for this file returns a formatted `User-Agent` string for http requests (to apis)
         - here's an example of what the string looks like: `flooded-area-moderation/3.2.0 (Node.js/22.12.0; Linux 6.8.0-1024-raspi; arm64; +https://nuzzles.dev/dev/flooded-area-moderation; contact:xxxxx@example.com)`
      - some variables are taken from the from [`./package.json`](../package.json): you should edit the `name`, `version`, and `homepage` keys inside that file and replace them with your own values
      - you'll also need to change the value of the `email` variable, or remove it from the `User-Agent` string
      - for any other changes to the `User-Agent` string, you can directly edit the string~
11. dependencies
   - open the command line inside the repository's main directory
   - run the command `npm install`
12. start the app
   - prefer using [`pm2`](https://pm2.io/)?
      - run the command `npm start`
      - *for more information on how to configure [`pm2`](https://pm2.io/) to your liking, see [pm2.io/docs/plus/overview](https://pm2.io/docs/plus/overview/)*
   - just wanna start the app from the terminal instantly?
      - run the command `npm run dev`
13. celebrate
   - congratulations! your app should be running now~


## 🛠️ advanced usage

- usage of the [`Jenkinsfile`](../Jenkinsfile) is completely optional and can be deleted if not needed
- for steps 5, 6, 7, and 8: if you prefer to insert these values directly inside the [`/src/data/config.js`](../src/data/config.js) file then you don't need to add these values to the `.env` file
   - this means that you can remove the keys or leave blank values for the placeholder keys
- you'll need to upload some emojis for the app to use too
   - download the [`/src/assets/emojis.zip`](../src/assets/emojis.zip) file and unzip the file: the contents of it are all images of all the emojis that the app uses
   - then, go to the [discord developer dashboard](https://discord.com/developers/applications) and navigate to your app's emoji tab
   - upload all the files from the [`/src/assets/emojis.zip`](../src/assets/emojis.zip) file and rename the emojis you upload to the filename of the image
   - with the way my helper package [@magicalbunny31/pawesome-utility-stuffs](https://github.com/magicalbunny31/pawesome-utility-stuffs), works the app's own emojis are bound to `Client#allEmojis` (you may even notice the references to this!) using the package's [emojis](https://github.com/magicalbunny31/pawesome-utility-stuffs/blob/main/src/functions/emojis.js) function
      - it works by fetching all emojis uploaded to the app and adding them to an object with the key as the name of the emoji and its value as the markdown for the emoji
      - the [emojis](https://github.com/magicalbunny31/pawesome-utility-stuffs/blob/main/src/functions/emojis.js) function also includes other custom emojis that exist in my own private servers - attempting to use these emojis may not work as your app won't exist in my private servers
         - note that the app's own emojis take precedence over the emojis from my private servers should there be a naming conflict with any extra emojis you decide to upload