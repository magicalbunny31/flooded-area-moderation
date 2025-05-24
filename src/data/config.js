import dotenvKey from "./dotenv-key.js";
import dotenv from "dotenv";
dotenv.config({ DOTENV_KEY: dotenvKey, path: `./src/.env` });


/**
 * 🗃️ this list defines the discord guilds and roblox experience that the app will run in
 * ↔️ one discord guild can only link to one roblox experience - there will be limited support for allowing multiple relationships between multiple discord guilds or roblox experiences
 * 📄 for typings on how to format your own entry in this list, see: /src/types/config.d.ts
 */
export default [{
   // flooded area community ↔️ flooded area
   discord: {
      apiKey: {
         bloxlink: process.env.BLOXLINK_SERVER_KEY_977254354589462618
      },
      guildId: `977254354589462618`,
      logs: {
         channelId: `985567722878402570`,
         webhookUrl: process.env.LOGS_WEBHOOK_URL_977254354589462618
      },
      roles: {
         moderatorIds: [ `989125486590451732` ]
      }
   },
   roblox: {
      apiKey: {
         cloud: process.env.ROBLOX_OPEN_CLOUD_API_KEY_1338193767
      },
      experience: {
         universeId: 1338193767,
         placeId: 3976767347
      }
   }
}, {
   // bun testers ↔️ tail test
   discord: {
      guildId: `859172731386986516`,
      logs: {
         channelId: `1306776370592088076`,
         webhookUrl: process.env.LOGS_WEBHOOK_URL_859172731386986516
      },
      roles: {
         moderatorIds: [ `1140661483404009597` ]
      }
   },
   roblox: {
      apiKey: {
         cloud: process.env.ROBLOX_OPEN_CLOUD_API_KEY_6606412610
      },
      experience: {
         universeId: 6606412610,
         placeId: 106827034557144
      }
   }
}];