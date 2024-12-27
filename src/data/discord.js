import dotenvKey from "./dotenv-key.js";
import dotenv from "dotenv";
dotenv.config({ DOTENV_KEY: dotenvKey, path: `./src/.env` });


export const FloodedAreaCommunity = {
   guildId: `977254354589462618`,
   logs: {
      channelId: `985567722878402570`,
      webhookUrl: process.env.LOGS_WEBHOOK_URL_977254354589462618
   },
   roles: {
      moderatorIds: [ `989125486590451732` ]
   }
};


/**
 * ✨ the discord guilds below aren't exactly flooded area but this app (in production) manages its moderations
 * 📂 go modularity !!
 */


export const BunTesters = {
   guildId: `859172731386986516`,
   logs: {
      channelId: `1306776370592088076`,
      webhookUrl: process.env.LOGS_WEBHOOK_URL_859172731386986516
   },
   roles: {
      moderatorIds: [ `1140661483404009597` ]
   }
};


export default [ FloodedAreaCommunity, BunTesters ];