import cache from "../../data/cache.js";
import config from "../../data/config.js";
import { content, modal, defaultBanReason } from "../../data/defaults.js";

import Discord from "discord.js";


export const guilds = config.map(config => config.discord.guildId);

export const data = (() => {
   const data = new Discord.SlashCommandBuilder()
      .setName(`mass-temp-ban`)
      .setDescription(`Temporarily ban multiple players from Flooded Area`)
      .addStringOption(
         new Discord.SlashCommandStringOption()
            .setName(`player`)
            .setDescription(`Player to temporarily ban`)
            .setMinLength(3)
            .setMaxLength(20)
            .setAutocomplete(true)
            .setRequired(true)
      )
      .addStringOption(
         new Discord.SlashCommandStringOption()
            .setName(`player-2`)
            .setDescription(`Player to temporarily ban`)
            .setMinLength(3)
            .setMaxLength(20)
            .setAutocomplete(true)
            .setRequired(true)
      )
      .addIntegerOption(
         new Discord.SlashCommandIntegerOption()
            .setName(`duration`)
            .setDescription(`Duration for these bans, it can be the time in seconds (86400) or as number/durations pairs (3d2h1m)`)
            .setMinValue(1)
            .setMaxValue(315_576_000_000)
            .setAutocomplete(true)
            .setRequired(true)
      )
      .addBooleanOption(
         new Discord.SlashCommandBooleanOption()
            .setName(`ban-alt-accounts`)
            .setDescription(`Also ban known alternate accounts belonging to these players?`)
      )
      .addStringOption(
         new Discord.SlashCommandStringOption()
            .setName(`public-ban-reason`)
            .setDescription(`Reason for this ban, shown to the banned players: must abide by Roblox Community Standards`)
            .setMaxLength(400)
      )
      .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageGuild);

   for (let i = 0; i < 8; i ++)
      data.addStringOption(
         new Discord.SlashCommandStringOption()
            .setName(`player-${i + 3}`)
            .setDescription(`Player to temporarily ban`)
            .setMinLength(3)
            .setMaxLength(20)
            .setAutocomplete(true)
      );

   return data;
})();


/**
 * @param {import("@flooded-area-moderation-types/client").ChatInputCommandInteraction} interaction
 */
export default async interaction => {
   // options
   const player          = interaction.options.getString(`player`);
   const player2         = interaction.options.getString(`player-2`);
   const duration        = interaction.options.getInteger(`duration`);
   const banAltAccounts  = interaction.options.getBoolean(`ban-alt-accounts`) ?? true;
   const publicBanReason = interaction.options.getString(`public-ban-reason`);
   const player3         = interaction.options.getString(`player-3`);
   const player4         = interaction.options.getString(`player-4`);
   const player5         = interaction.options.getString(`player-5`);
   const player6         = interaction.options.getString(`player-6`);
   const player7         = interaction.options.getString(`player-7`);
   const player8         = interaction.options.getString(`player-8`);
   const player9         = interaction.options.getString(`player-9`);
   const player10        = interaction.options.getString(`player-10`);


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


   if (publicBanReason) { // public-ban-reason option specified, skip the modal
      // "defer" the interaction
      const interactionResponse = await interaction.reply({
         content: Discord.heading(`${interaction.client.allEmojis.loading} ${content.fetchingPlayerData}`, Discord.HeadingLevel.Three),
         withResponse: true
      });


      // format private ban reason
      const privateBanReason = [
         publicBanReason
            || defaultBanReason,
         modal.modalPrivateReasonAttribution(interaction.user)
      ]
         .join(``);


      // push these moderations
      const moderationData = players.map(player =>
         ({
            action: `temp-ban`,
            player,
            length: duration,
            excludeAltAccounts: !banAltAccounts,
            displayReason: publicBanReason || defaultBanReason,
            privateReason: privateBanReason
         })
      );

      await interaction.client.moderations.pushModerations(interactionResponse.resource.message, moderationData);


   } else { // no public-ban-reason option specified, show the modal
      // set command data in the cache for this interaction
      const commandDataId = interaction.id;

      cache.set(commandDataId, {
         action: `temp-ban`,
         players,
         length: duration,
         excludeAltAccounts: !banAltAccounts
      });


      // respond to the interaction
      await interaction.showModal(
         modal.massTempBanModal(commandDataId, interaction.user)
      );
   };
};