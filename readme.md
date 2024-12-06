# 🤖 flooded-area-moderation "the killer 🤖"

🤖 a discord app used for managing roblox bans, using the roblox apis

🏙️ made primarily for [flooded area community](https://discord.com/servers/flooded-area-community-977254354589462618)


## 🏡 find out more about "the killer 🤖"

🔗 https://nuzzles.dev/dev/flooded-area-moderation


## 💻 setup


### 📂 development

the easiest and quickest way to get this app working for you!

> [!TIP]
> you should consider [disabling @magicalbunny31/fennec-utilities functionality](#-disabling-magicalbunny31fennec-utilities-functionality) (see below)

1. `install your environment`
   - have [node.js](https://nodejs.org) >18.0.0 installed
2. `environment variables`
   - input values into [`.env.sample`](.env.sample) according to their keys
   - rename [`.env.sample`](.env.sample) to `.env`
   - replace any occurrences of `<UNIVERSE_ID>` in the keys with your roblox experience's own universe id: this can be repeated as many times as necessary for multiple roblox universes
   - replace any occurrences of `<GUILD_ID>` in the keys with your roblox experience's linked discord guilds: for every roblox universe managed there must be at most one linked discord guild
3. `configuration files`
   - these files are kinda like environment variables, however they aren't important enough to stay hidden
   - edit the following files and input your own values:
      - [`data/developers.js`](data/developers.js)
      - [`data/discord.js`](data/discord.js)
      - [`data/experiences.js`](data/experiences.js)
      - [`data/user-agent.js`](data/user-agent.js)
4. `dependencies`
   - open the command line inside the repository's main directory
   - run the command `npm install`
5. `start the app`
   - run the command `npm run dev`


### 🌐 production

for those who really want their own "the killer 🤖"~

> [!IMPORTANT]
> i will NOT provide help for any additional modifications to this code or how to use different tools and packages - you're on your own at that point!

> [!IMPORTANT]
> these steps assume that you are using [pm2](https://pm2.io) as your process manager

> [!NOTE]
> usage of the [`Jenkinsfile`](Jenkinsfile) is completely optional and can be deleted if not needed

1. `i can't be bothered to re-write steps`
   - follow steps 1-4 in [**📂 development**](#-development)
2. `start the app`
   - run the command `npm start`


### 🚫 disabling [@magicalbunny31/fennec-utilities](https://github.com/magicalbunny31/fennec-utilities) functionality

[@magicalbunny31/fennec-utilities](https://github.com/magicalbunny31/fennec-utilities) is my own development package for my apps

for more information, please see [nuzzles.dev/dev/fennec](https://nuzzles.dev/dev/fennec)

> [!IMPORTANT]
> please only follow these steps after following [**📂 development**](#-development) or [**🌐 production**](#-production)

> [!NOTE]
> this is *only* a workaround for getting things to work quickly: for longer-term solutions, you'll be on your own for removing any references to this package and other related issues regarding my development environment

> [!NOTE]
> you may start getting errors logged in your console saying "`🚫 FennecClient.initialise() not run yet`", however these are safe to ignore

1. `edit your files`
   - open [`index.js`](index.js) and locate the line containing: "`await client.fennec.initialise();`"
   - delete this line or comment out this line by prepending `//` to it


## 🗃️ previous versions


🏚️ ~~[v1](https://github.com/magicalbunny31/flooded-area-moderation/tree/v1)~~

🏚️ ~~[v2](https://github.com/magicalbunny31/flooded-area-moderation/tree/v2)~~

🏡 **v3** (this branch!)


## 📚 license ([MIT](license))

see [`license`](license)~ ✨


## contributors 👥
🦊 [@magicalbunny31](https://github.com/magicalbunny31) ([nuzzles.dev](https://nuzzles.dev))