import cache from "../../data/cache.js";
import config from "../../data/config.js";
import { content, modal, defaultBanReason } from "../../data/defaults.js";

import Discord from "discord.js";


export const guilds = config.map(config => config.discord.guildId);

export const data = new Discord.SlashCommandBuilder()
   .setName(`ban`)
   .setDescription(`Permanently ban a player from Flooded Area`)
   .addStringOption(
      new Discord.SlashCommandStringOption()
         .setName(`player`)
         .setDescription(`Player to permanently ban`)
         .setMinLength(3)
         .setMaxLength(20)
         .setAutocomplete(true)
         .setRequired(true)
   )
   .addBooleanOption(
      new Discord.SlashCommandBooleanOption()
         .setName(`ban-alt-accounts`)
         .setDescription(`Also ban known alternate accounts belonging to this player?`)
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
   const banAltAccounts  = interaction.options.getBoolean(`ban-alt-accounts`) ?? true;
   const publicBanReason = interaction.options.getString(`public-ban-reason`);


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
      const moderationData = {
         action: `ban`,
         player,
         length: undefined,
         excludeAltAccounts: !banAltAccounts,
         displayReason: publicBanReason || defaultBanReason,
         privateReason: privateBanReason
      };

      await interaction.client.moderations.pushModeration(interactionResponse.resource.message, moderationData);


   } else { // no public-ban-reason option specified, show the modal
      // set command data in the cache for this interaction
      const commandDataId = interaction.id;

      cache.set(commandDataId, {
         action: `ban`,
         players: [ player ],
         length: undefined,
         excludeAltAccounts: !banAltAccounts
      });


      // respond to the interaction
      await interaction.showModal(
         modal.banModal(commandDataId, interaction.user)
      );
   };
};