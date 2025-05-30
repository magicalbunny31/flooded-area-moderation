import config from "../../data/config.js";
import { content } from "../../data/defaults.js";

import Discord from "discord.js";


export const guilds = config.map(config => [ config.discord.guildId, config.roblox.experience.name ]);

export const getData = experienceName => {
   const data = new Discord.SlashCommandBuilder()
      .setName(`mass-unban`)
      .setDescription(`Revoke multiple players' bans from ${experienceName}`)
      .addStringOption(
         new Discord.SlashCommandStringOption()
            .setName(`player`)
            .setDescription(`Player's ban to revoke`)
            .setMinLength(3)
            .setMaxLength(20)
            .setAutocomplete(true)
            .setRequired(true)
      )
      .addStringOption(
         new Discord.SlashCommandStringOption()
            .setName(`player-2`)
            .setDescription(`Player's ban to revoke`)
            .setMinLength(3)
            .setMaxLength(20)
            .setAutocomplete(true)
            .setRequired(true)
      )
      .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageGuild);

   for (let i = 0; i < 8; i ++)
      data.addStringOption(
         new Discord.SlashCommandStringOption()
            .setName(`player-${i + 3}`)
            .setDescription(`Player's ban to revoke`)
            .setMinLength(3)
            .setMaxLength(20)
            .setAutocomplete(true)
      );

   return data;
};


/**
 * @param {import("@flooded-area-moderation-types/client").ChatInputCommandInteraction} interaction
 */
export default async interaction => {
   // options
   const player   = interaction.options.getString(`player`);
   const player2  = interaction.options.getString(`player-2`);
   const player3  = interaction.options.getString(`player-3`);
   const player4  = interaction.options.getString(`player-4`);
   const player5  = interaction.options.getString(`player-5`);
   const player6  = interaction.options.getString(`player-6`);
   const player7  = interaction.options.getString(`player-7`);
   const player8  = interaction.options.getString(`player-8`);
   const player9  = interaction.options.getString(`player-9`);
   const player10 = interaction.options.getString(`player-10`);


   // players to moderate
   const players = [
      player,
      player2,
      player3,
      player4,
      player5,
      player6,
      player7,
      player8,
      player9,
      player10
   ]
      .filter(Boolean);


   // "defer" the interaction
   const interactionResponse = await interaction.reply({
      content: Discord.heading(`${interaction.client.allEmojis.loading} ${content.fetchingPlayerData}`, Discord.HeadingLevel.Three),
      withResponse: true
   });


   // push these moderations
   const moderationData = players.map(player =>
      ({
         action: `revoke-ban`,
         player,
         length: undefined,
         excludeAltAccounts: undefined,
         displayReason: undefined,
         privateReason: undefined
      })
   );

   await interaction.client.moderations.pushModerations(interactionResponse.resource.message, moderationData);
};