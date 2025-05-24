import cache from "../../data/cache.js";
import config from "../../data/config.js";
import { content, modal, defaultBanReason } from "../../data/defaults.js";

import Discord from "discord.js";
import dayjs from "dayjs";


/**
 * @param {import("@flooded-area-moderation-types/client").ModalSubmitInteraction} interaction
 */
export default async interaction => {
   // modal data
   const [ _modal, commandDataId ] = interaction.customId.split(`:`);

   const displayReason = interaction.fields.getTextInputValue(`display-reason`)
      || defaultBanReason;

   const privateReason = [
      interaction.fields.getTextInputValue(`private-reason`)
         || displayReason,
      modal.modalPrivateReasonAttribution(interaction.user)
   ]
      .join(``);


   // command data
   const commandData = cache.get(commandDataId);

   if (!commandData) {
      const moderationLogs = config
         .find(config => config.discord.guildId === interaction.guildId)
         .discord.logs.channelId;

      const commandDataExpiresAt = dayjs
         .unix(Discord.SnowflakeUtil.timestampFrom(commandDataId))
         .add(24, `hours`)
         .toDate();

      const commandDataExpired = dayjs(commandDataExpiresAt)
         .isBefore(interaction.createdAt);

      if (commandDataExpired)
         return await interaction.reply({
            content: [
               Discord.heading(`${interaction.client.allEmojis.error} ${content.timedOut}`, Discord.HeadingLevel.Three),
               `Data for this command expired ${Discord.time(commandDataExpiresAt, Discord.TimestampStyles.RelativeTime)} - don't take so long to moderate people next time.`
            ]
               .join(`\n`),
            ephemeral: true
         });

      else
         return await interaction.reply({
            content: [
               Discord.heading(`${interaction.client.allEmojis.warning} Command already processed`, Discord.HeadingLevel.Three),
               `This command has already been processed so you shouldn't need to do anything else.`,
               `If nothing happened in ${Discord.channelMention(moderationLogs)}, the command may have errored and you should try again.`
            ]
               .join(`\n`),
            ephemeral: true
         });
   };


   // "defer" the interaction
   const interactionResponse = await interaction.reply({
      content: Discord.heading(`${interaction.client.allEmojis.loading} ${content.fetchingPlayerData}`, Discord.HeadingLevel.Three),
      withResponse: true
   });


   // push these moderations
   const moderationData = commandData.players.map(player =>
      ({
         action: commandData.action,
         player,
         length: commandData.length,
         excludeAltAccounts: commandData.excludeAltAccounts,
         displayReason,
         privateReason
      })
   );

   await interaction.client.moderations.pushModerations(interactionResponse.resource.message, moderationData);
};