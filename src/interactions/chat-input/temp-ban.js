import cache from "../../data/cache.js";
import config from "../../data/config.js";
import { content, modal, defaultBanReason } from "../../data/defaults.js";

import Discord from "discord.js";


export const guilds = config.map(config => config.discord.guildId);

export const data = new Discord.SlashCommandBuilder()
   .setName(`temp-ban`)
   .setDescription(`Temporarily ban a player from Flooded Area`)
   .addStringOption(
      new Discord.SlashCommandStringOption()
         .setName(`player`)
         .setDescription(`Player to temporarily ban`)
         .setMinLength(3)
         .setMaxLength(20)
         .setAutocomplete(true)
         .setRequired(true)
   )
   .addIntegerOption(
      new Discord.SlashCommandIntegerOption()
         .setName(`duration`)
         .setDescription(`Duration for this ban, it can be the time in seconds (86400) or as number/durations pairs (3d2h1m)`)
         .setMinValue(1)
         .setMaxValue(315_576_000_000)
         .setAutocomplete(true)
         .setRequired(true)
   )
   .addBooleanOption(
      new Discord.SlashCommandBooleanOption()
         .setName(`ban-alt-accounts`)
         .setDescription(`Also temporarily ban known alternate accounts belonging to this player?`)
   )
   .addStringOption(
      new Discord.SlashCommandStringOption()
         .setName(`public-ban-reason`)
         .setDescription(`Reason for this ban, shown to the banned player: must abide by Roblox Community Standards`)
         .setMaxLength(400)
   )
   .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageGuild);


/**
 * @param {import("@flooded-area-moderation-types/client").ChatInputCommandInteraction} interaction
 */
export default async interaction => {
   // options
   const player          = interaction.options.getString(`player`);
   const duration        = interaction.options.getInteger(`duration`);
   const banAltAccounts  = interaction.options.getBoolean(`ban-alt-accounts`) ?? true;
   const publicBanReason = interaction.options.getString(`public-ban-reason`);


   if (publicBanReason) { // public-ban-reason option specified, skip the modal
      // "defer" the interaction
      const interactionResponse = await interaction.reply({
         content: Discord.heading(`${interaction.client.allEmojis.loading} ${content.fetchingPlayerData}`, Discord.HeadingLevel.Three),
         fetchReply: true
      });


      // format private ban reason
      const privateBanReason = [
         publicBanReason
            || defaultBanReason,
         modal.modalPrivateReasonAttribution(interaction.user)
      ]
         .join(``);


      // push these moderations
      const moderationData = {
         action: `temp-ban`,
         player,
         length: duration,
         excludeAltAccounts: !banAltAccounts,
         displayReason: publicBanReason || defaultBanReason,
         privateReason: privateBanReason
      };

      await interaction.client.moderations.pushModeration(interactionResponse, moderationData);


   } else { // no public-ban-reason option specified, show the modal
      // set command data in the cache for this interaction
      const commandDataId = interaction.id;

      cache.set(commandDataId, {
         action: `temp-ban`,
         players: [ player ],
         length: duration,
         excludeAltAccounts: !banAltAccounts
      });


      // respond to the interaction
      await interaction.showModal(
         modal.tempBanModal(commandDataId, interaction.user)
      );
   };
};