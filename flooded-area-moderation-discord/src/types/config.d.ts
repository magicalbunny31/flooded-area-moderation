import { ColorResolvable } from "discord.js"


type Entry = {
   discord: {
      accentColour: ColorResolvable; // 🎨 hex colour to set for the container accent colours - easiest to be set as a hex value (0xffffff or "#ffffff") but can be any valid Discord.ColorResolvable value
      apiKey?: { // 🌫️ if this object is empty (due to not specifying the `bloxlink` key below, this can be omitted)
         bloxlink?: string; // 🔑 the bloxlink api key for the discord guild (optional)
      },
      guildId: string; // 🆔 the id of the discord guild the app will create commands in
      logs: {
         channelId: string; // #️⃣ the id of the channel to send logs in
         webhookUrl: string; // 🔗 the webhook url in the channel this app should use to send logs in
      },
      roles: {
         moderatorIds: string[]; // 👥 a list of role ids which are able to use this app's commands
      }
   };
   roblox: {
      apiKey: {
         cloud: string; // 🔑 the roblox open cloud api key for this roblox experience
      };
      experience: {
         name: string; // 🏷️ the name of the experience
         placeId: number | string; // 🆔 the place id of the roblox experience
         universeId: number | string; // 🆔 the universe id of the roblox experience
      };
   };
};