import { content } from "../../data/defaults.js";
import { guilds as commandGuilds } from "../../data/experiences.js";
import { ModerationsHistory } from "../../data/moderations.js";
import { legacy } from "../../data/roblox.js";

import Discord from "discord.js";


/**
 * @param {import("@flooded-area-moderation-types/client").Message} message
 */
export default async (message, ...args) => {
   // options
   const [ player ] = args;
   const hideModerator = false;


   // no player
   if (!player)
      return await message.reply({
         content: Discord.heading(`${message.client.allEmojis.error} You must input a player to view moderation history for`, Discord.HeadingLevel.Three),
         allowedMentions: {
            repliedUser: false
         }
      });


   // "defer" the interaction
   const messageResponse = await message.reply({
      content: Discord.heading(`${message.client.allEmojis.loading} ${content.fetchingPlayerData}`, Discord.HeadingLevel.Three),
      allowedMentions: {
         repliedUser: false
      }
   });


   // get this player
   const playerDataIfUsername = await legacy.getUserByUsername(player);
   const playerDataIfId       = await legacy.getUserByUserId  (player);


   // get player data and prompt if both the above data returns something
   const playerData = await message.client.moderations.resolvePlayerData(messageResponse, playerDataIfId, playerDataIfUsername);


   // this isn't a player
   if (!playerData)
      return await messageResponse.edit({
         content: [
            Discord.heading(`${message.client.allEmojis.error} Unknown player "${Discord.escapeMarkdown(player)}"`, Discord.HeadingLevel.Three),
            `Input a player's ${Discord.bold(`Roblox username`)} or ${Discord.bold(`Player id`)}.`,
            `If this player is correct, ${Discord.bold(`you may have inputted a player's previous username`)} or ${Discord.bold(Discord.hyperlink(`Roblox may be having an outage`, Discord.hideLinkEmbed(`https://status.roblox.com`)))} right now.`
         ]
            .join(`\n`),
         allowedMentions: {
            repliedUser: false
         }
      });


   // show moderation history
   const History = new ModerationsHistory(messageResponse, playerData.name, 0, hideModerator);

   await History.showModerationHistory();
};