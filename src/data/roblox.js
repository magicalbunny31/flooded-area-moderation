import cache from "./cache.js";
import config from "./config.js";
import userAgent from "./user-agent.js";

import path from "node:path";
import Discord from "discord.js";
import chalk from "chalk";
import { colours } from "@magicalbunny31/pawesome-utility-stuffs";


import dotenvKey from "./dotenv-key.js";
import dotenv from "dotenv";
dotenv.config({ DOTENV_KEY: dotenvKey, path: `./src/.env` });


import { FennecClient } from "@magicalbunny31/fennec-utilities";
const fennec = new FennecClient({
   fennecProcess: `other-stuffs`,
   fennecUtilities: {
      baseUrl:       process.env.FENNEC_UTILITIES_URL,
      authorisation: process.env.FENNEC_UTILITIES_AUTHORISATION
   },
   useAnnouncement: false,
   useApplicationStatusApplicationStatisticsStatus: false,
   useBlacklist: false,
   useOnlineStatus: false
});
await fennec.initialise();


const HTTPStatusCodes = {
   NotFound: 404
};

const headers = {
   "Accept": `application/json`,
   "User-Agent": userAgent
};

const request = {
   get: async (url, requestHeaders) => await fetch(url, {
      headers: {
         ...headers,
         ...requestHeaders
      }
   }),

   post: async (url, body, requestHeaders = {}) => await fetch(url, {
      method: `POST`,
      headers: {
         ...headers,
         ...requestHeaders,
         "Content-Type": `application/json`
      },
      body: JSON.stringify(body)
   }),

   patch: async (url, body, requestHeaders = {}) => await fetch(url, {
      method: `PATCH`,
      headers: {
         ...headers,
         ...requestHeaders,
         "Content-Type": `application/json`
      },
      body: JSON.stringify(body)
   })
};

const logError = async response => {
   const cwd = process.cwd();
   const file = import.meta.filename;
   const location = path.relative(cwd, file);

   console.error(chalk.hex(colours.flooded_area_moderation)(`~ bad request from ${location}! see below for the error..`));
   console.line(`${response.url}: ${response.status} ${response.statusText}`);

   const responseBody = await (async () => {
      try {
         const data = await response.json();
         return JSON.stringify(data, null, 3);
      } catch {
         return null;
      };
   })();

   console.line(responseBody ?? `no response body`);

   try {
      const source = `${Discord.inlineCode(`data`)}/${Discord.inlineCode(`roblox`)}`;
      const error = [
         `${response.url}: ${response.status} ${response.statusText}`,
         responseBody
      ]
         .filter(Boolean)
         .join(`\n`);
      await fennec.postErrorLog(new Error(error), source, new Date());

   } catch (error) {
      console.error(chalk.hex(colours.flooded_area_moderation)(`~ ..the error handler failed to log this caught error in ${location}! see below for its error..`));
      console.line(error.stack ?? error ?? `no error..?`);
   };
};


export const discord = {


   usersToDiscordAutocompleteChoices: users =>
      users.map(user =>
         ({
            name: `${user.displayName} (@${user.name}) [${user.id}]`,
            value: user.name
         })
      )


};


export const bloxlink = {


   /**
    * @type {import("@flooded-area-moderation-types/roblox").robloxToDiscord}
    */
   async robloxToDiscord(guildId, playerId) {
      // get cached data
      const cacheId = `bloxlink:${guildId}:robloxToDiscord:${playerId}`;
      if (cache.has(cacheId))
         return cache.get(cacheId);

      // get this guildId's api key
      const apiKey = config
         .find(config => config.discord.guildId === guildId)
         .discord.apiKey?.bloxlink;

      // no api key
      if (!apiKey)
         return undefined;

      // send a request to the api
      const response = await request.get(`https://api.blox.link/v4/public/guilds/${guildId}/roblox-to-discord/${playerId}`, {
         Authorization: apiKey
      });

      if (response.ok) { // user found
         // parse response data
         const data = await response.json();
         const parsedData = data?.discordIDs || [];

         // set cached data
         cache.set(cacheId, parsedData);

         // set cached data for other endpoint
         for (const userId of parsedData)
            cache.set(`bloxlink:${guildId}:discordToRoblox:${userId}`, playerId);

         // return data
         return parsedData;

      } else if (response.status === HTTPStatusCodes.NotFound) { // user not found
         // set cached data
         cache.set(cacheId, []);

         // return data
         return undefined;

      } else { // api error
         // handle this error
         await logError(response);
      };
   },


   /**
    * @type {import("@flooded-area-moderation-types/roblox").discordToRoblox}
    */
   async discordToRoblox(guildId, userId) {
      // get cached data
      const cacheId = `bloxlink:${guildId}:discordToRoblox:${userId}`;
      if (cache.has(cacheId))
         return cache.get(cacheId);

      // get this guildId's api key
      const apiKey = config
         .find(config => config.discord.guildId === guildId)
         .discord.apiKey?.bloxlink;

      // no api key
      if (!apiKey)
         return undefined;

      // send a request to the api
      const response = await request.get(`https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${userId}`, {
         Authorization: apiKey
      });

      if (response.ok) { // player found
         // parse response data
         const data = await response.json();
         const parsedData = data?.robloxID;

         // set cached data
         cache.set(cacheId, parsedData);

         // set cached data for other endpoint
         cache.set(`bloxlink:${guildId}:robloxToDiscord:${parsedData}`, [ userId ]);

         // return data
         return parsedData;

      } else if (response.status === HTTPStatusCodes.NotFound) { // player not found
         // set cached data
         cache.set(cacheId, undefined);

         // return data
         return undefined;

      } else { // api error
         // handle this error
         await logError(response);
      };
   }


};


export const legacy = {


   /**
    * @type {import("@flooded-area-moderation-types/roblox").getUserByUserId}
    */
   async getUserByUserId(userId) {
      // get cached data
      const cacheId = `legacy:getUserByUserId:${userId}`;
      if (cache.has(cacheId))
         return cache.get(cacheId);

      // send a request to the api
      const response = await request.get(`https://users.roblox.com/v1/users/${userId}`);

      if (response.ok) { // player found
         // parse response data
         const data = await response.json();

         // set cached data
         cache.set(cacheId, data);

         // return data
         return data;

      } else if (response.status === HTTPStatusCodes.NotFound) { // player not found
         // set cached data
         cache.set(cacheId, undefined);

         // return data
         return undefined;

      } else { // api error
         // handle this error
         await logError(response);
      };
   },


   /**
    * @type {import("@flooded-area-moderation-types/roblox").getUsersByUsernames}
    */
   async getUsersByUsernames(usernames, excludeBannedUsers = false) {
      // no usernames
      if (!usernames.length)
         return [];

      // send a request to the api
      const response = await request.post(`https://users.roblox.com/v1/usernames/users`, {
         usernames, excludeBannedUsers
      });

      if (response.ok) { // players found
         // parse response data
         const data = await response.json();

         // set cached data
         for (const d of data.data) {
            const cacheId = `legacy:getUserByUsername:${d.requestedUsername}`;
            cache.set(cacheId, d);
         };

         // return data
         return data.data;

      } else { // api error
         // handle this error
         await logError(response);
      };
   },


   /**
    * @type {import("@flooded-area-moderation-types/roblox").getUserByUsername}
    */
   async getUserByUsername(username, excludeBannedUsers = false) {
      // get cached data
      const cacheId = `legacy:getUserByUsername:${username}`;
      if (cache.has(cacheId))
         return cache.get(cacheId);

      // send a request to the api
      const data = await this.getUsersByUsernames([ username ], excludeBannedUsers);

      // return data
      return data?.find(({ requestedUsername }) => requestedUsername === username) ?? null;
   },


   /**
    * @type {import("@flooded-area-moderation-types/roblox").getAvatarHeadshotsByUserIds}
    */
   async getAvatarHeadshotsByUserIds(userIds, size = `48x48`, format = `Png`, isCircular = false) {
      // no player ids
      if (!userIds.length)
         return [];

      // send a request to the api
      const response = await request.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds.join(`,`)}&size=${size}&format=${format}&isCircular=${isCircular}`);

      if (response.ok) { // players found
         // parse response data
         const data = await response.json();

         // set cached data
         for (const d of data.data) {
            const cacheId = `legacy:getAvatarHeadshotByUserId:${d.targetId}`;
            cache.set(cacheId, d);
         };

         // return data
         return data.data;

      } else { // api error
         // handle this error
         await logError(response);
      };
   },


   /**
    * @type {import("@flooded-area-moderation-types/roblox").getAvatarHeadshotByUserId}
    */
   async getAvatarHeadshotByUserId(userId, size = `48x48`, format = `Png`, isCircular = false) {
      // get cached data
      const cacheId = `legacy:getAvatarHeadshotByUserId:${userId}`;
      if (cache.has(cacheId))
         return cache.get(cacheId);

      // send a request to the api
      const data = await this.getAvatarHeadshotsByUserIds([ userId ], size, format, isCircular);

      // return data
      return data?.find(({ targetId }) => targetId === userId) ?? null;
   },


   /**
    * @type {import("@flooded-area-moderation-types/roblox").getUserProfileLinkFromUserId}
    */
   getUserProfileLinkFromUserId: userId => `https://www.roblox.com/users/${userId}/profile`


};


export const cloud = {


   getApiKey: universeId => config
      .find(config => config.roblox.experience.universeId === universeId)
      .roblox.apiKey.cloud,


   /**
    * @type {import("@flooded-area-moderation-types/roblox").banUser}
    */
   async banUser(universeId, playerId, duration, privateReason, displayReason, excludeAltAccounts) {
      const apiKey = this.getApiKey(universeId);

      const response = await request.patch(`https://apis.roblox.com/cloud/v2/universes/${universeId}/user-restrictions/${playerId}`, {
         gameJoinRestriction: {
            active: true,
            startTime: new Date().toISOString(),
            ...duration
               ? { duration: `${duration}s` }
               : {},
            privateReason,
            displayReason,
            excludeAltAccounts,
            inherited: true
         }
      }, {
         "X-Api-Key": apiKey
      });

      if (response.ok) {
         const data = await response.json();
         return data;

      } else {
         await logError(response);
      };
   },


   /**
    * @type {import("@flooded-area-moderation-types/roblox").revokeUserBan}
    */
   async revokeUserBan(universeId, playerId, privateReason, displayReason) {
      const apiKey = this.getApiKey(universeId);

      const response = await request.patch(`https://apis.roblox.com/cloud/v2/universes/${universeId}/user-restrictions/${playerId}`, {
         gameJoinRestriction: {
            active: false,
            startTime: new Date().toISOString(),
            privateReason,
            displayReason,
            excludeAltAccounts: false,
            inherited: true
         }
      }, {
         "X-Api-Key": apiKey
      });

      if (response.ok) {
         const data = await response.json();
         return data;

      } else {
         await logError(response);
      };
   },


   /**
    * @type {import("@flooded-area-moderation-types/roblox").getModerationLogs}
    */
   async getModerationLogs(universeId, playerId = undefined, maxPageSize = 100, nextPageToken = undefined) {
      const apiKey = this.getApiKey(universeId);

      const response = await request.get(
         [
            `https://apis.roblox.com/cloud/v2/universes/${universeId}/user-restrictions:listLogs`,
            `?maxPageSize=${maxPageSize}`,
            ...playerId
               ? [ `&filter=${encodeURIComponent(`user == 'users/${playerId}'`)}` ]
               : [],
            ...nextPageToken
               ? [ `&pageToken=${nextPageToken}` ]
               : []
         ]
            .join(``),
         {
            "X-Api-Key": apiKey
         }
      );

      if (response.ok) {
         const data = await response.json();
         return data;

      } else {
         await logError(response);
      };
   },


   /**
    * @type {import("@flooded-area-moderation-types/roblox").listModerations}
    */
   async listModerations(universeId, maxPageSize = 100, filterActive = true, nextPageToken = undefined) {
      const apiKey = this.getApiKey(universeId);

      const response = await request.get(
         [
            `https://apis.roblox.com/cloud/v2/universes/${universeId}/user-restrictions`,
            `?maxPageSize=${maxPageSize}`,
            `&filter=${encodeURIComponent(`game_join_restriction.active == '${filterActive}'`)}`,
            ...nextPageToken
               ? [ `&pageToken=${nextPageToken}` ]
               : []
         ]
            .join(``),
         {
            "X-Api-Key": apiKey
         }
      );

      if (response.ok) {
         const data = await response.json();
         return data;

      } else {
         await logError(response);
      };
   },


   /**
    * @type {import("@flooded-area-moderation-types/roblox").getUserRestriction}
    */
   async getUserRestriction(universeId, playerId) {
      const apiKey = this.getApiKey(universeId);

      const response = await request.get(`https://apis.roblox.com/cloud/v2/universes/${universeId}/user-restrictions/${playerId}`, {
         "X-Api-Key": apiKey
      });

      if (response.ok) {
         const data = await response.json();
         return data;

      } else {
         await logError(response);
      };
   }


};