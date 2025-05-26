import ModerationsHistory from "../../classes/moderations-history.js";
import config from "../../data/config.js";
import { content } from "../../data/defaults.js";
import { legacy } from "../../data/roblox.js";

import Discord from "discord.js";


export const guilds = config.map(config => [ config.discord.guildId, config.roblox.experience.name ]);

export const getData = experienceName => new Discord.SlashCommandBuilder()
   .setName(`moderation-history`)
   .setDescription(`View a player's moderation history in ${experienceName}`)
   .addStringOption(
      new Discord.SlashCommandStringOption()
         .setName(`player`)
         .setDescription(`Player's moderation history to view`)
         .setAutocomplete(true)
         .setRequired(true)
   )
   .addBooleanOption(
      new Discord.SlashCommandBooleanOption()
         .setName(`hide-moderator`)
         .setDescription(`Hide the moderators on the log embeds?`)
   )
   .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageGuild);


/**
 * @param {import("@flooded-area-moderation-types/client").ChatInputCommandInteraction} interaction
 */
export default async interaction => {
   // options
   const player        = interaction.options.getString(`player`);
   const hideModerator = interaction.options.getBoolean(`hide-moderator`);


   // "defer" the interaction
   const interactionResponse = await interaction.reply({
      content: Discord.heading(`${interaction.client.allEmojis.loading} ${content.fetchingPlayerData}`, Discord.HeadingLevel.Three),
      withResponse: true
   });


   // get this player
   const playerDataIfUsername = await legacy.getUserByUsername(player);
   const playerDataIfId       = await legacy.getUserByUserId  (player);


   // get player data and prompt if both the above data returns something
   const playerData = await interaction.client.moderations.resolvePlayerData(interactionResponse.resource.message, playerDataIfId, playerDataIfUsername);


   // this isn't a player
   if (!playerData)
      return await interaction.editReply({
         content: [
            Discord.heading(`${interaction.client.allEmojis.error} Unknown player "${Discord.escapeMarkdown(player)}"`, Discord.HeadingLevel.Three),
            `Input a player's ${Discord.bold(`Roblox username`)} or ${Discord.bold(`Player id`)}.`,
            `If this player is correct, ${Discord.bold(`you may have inputted a player's previous username`)} or ${Discord.bold(Discord.hyperlink(`Roblox may be having an outage`, Discord.hideLinkEmbed(`https://status.roblox.com`)))} right now.`
         ]
            .join(`\n`)
      });


   // show moderation history
   const History = new ModerationsHistory(interaction, playerData.name, 0, hideModerator);

   await History.showModerationHistory();
};