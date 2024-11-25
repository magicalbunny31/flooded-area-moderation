import dotenvKey from "./dotenv-key.js";
import dotenv from "dotenv";
dotenv.config({ DOTENV_KEY: dotenvKey });


import { FloodedAreaCommunity } from "./discord.js";

export const FloodedArea = {
   apiKey: {
      cloud: process.env.ROBLOX_OPEN_CLOUD_API_KEY_1338193767,
      bloxlink: process.env.BLOXLINK_SERVER_KEY_977254354589462618
   },
   experience: {
      universeId: 1338193767,
      placeId: 3976767347
   },
   guild: {
      guildIds: [ FloodedAreaCommunity.guildId ]
   }
};


/**
 * ✨ the roblox experiences below aren't exactly flooded area but this app (in production) manages its moderations
 * 📂 go modularity !!
 */


import { BunTesters } from "./discord.js";

export const TailTest = {
   apiKey: {
      cloud: process.env.ROBLOX_OPEN_CLOUD_API_KEY_6606412610
   },
   experience: {
      universeId: 6606412610,
      placeId: 106827034557144
   },
   guild: {
      guildIds: [ BunTesters.guildId ]
   }
};


const experiences = [ FloodedArea, TailTest ];

export default experiences;


export const guilds = experiences
   .flatMap(experience => experience.guild.guildIds);