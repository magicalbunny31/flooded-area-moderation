import config from "../../data/config.js";
import { content } from "../../data/defaults.js";

import Discord from "discord.js";


export const guilds = config.map(config => config.discord.guildId);

export const data = new Discord.SlashCommandBuilder()
   .setName(`unban`)
   .setDescription(`Revoke a player's ban from Flooded Area`)
   .addStringOption(
      new Discord.SlashCommandStringOption()
         .setName(`player`)
         .setDescription(`Player's ban to revoke`)
         .setMinLength(3)
         .setMaxLength(20)
         .setAutocomplete(true)
         .setRequired(true)
   )
   .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageGuild);


/**
 * @param {import("@flooded-area-moderation-types/client").ChatInputCommandInteraction} interaction
 */
export default async interaction => {
   // options
   const player = interaction.options.getString(`player`);


   // "defer" the interaction
   const interactionResponse = await interaction.reply({
      content: Discord.heading(`${interaction.client.allEmojis.loading} ${content.fetchingPlayerData}`, Discord.HeadingLevel.Three),
      withResponse: true
   });


   // push these moderations
   const moderationData = {
      action: `revoke-ban`,
      player,
      length: undefined,
      excludeAltAccounts: undefined,
      displayReason: undefined,
      privateReason: undefined
   };

   await interaction.client.moderations.pushModeration(interactionResponse.resource.message, moderationData);
};