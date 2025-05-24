import config from "../data/config.js";
import { modal } from "../data/defaults.js";
import { legacy, cloud } from "../data/roblox.js";

import Discord from "discord.js";
import dayjs from "dayjs";


export default class ModerationsHistory {
   /**
    * 📦 utilities for the moderation history command so i don't keep repeating my code (i hate that)
    */
   constructor(interactionOrMessage, playerUsername, menuIndex, hideModerator, selectedId = undefined) {
      this.#interactionOrMessage = interactionOrMessage;
      this.#playerUsername = playerUsername;
      this.#menuIndex = menuIndex;
      this.#hideModerator = hideModerator;
      this.#selectedId = selectedId;
      this.#universeId = this.#interactionOrMessage.client.moderations.getUniverseId(this.#interactionOrMessage.guildId);
   };


   /**
    * @type {import("@flooded-area-moderation-types/client").ChatInputCommandInteraction | import("@flooded-area-moderation-types/client").ButtonInteraction | import("@flooded-area-moderation-types/client").StringSelectMenuInteraction | import("@flooded-area-moderation-types/client").Message}
    */
   #interactionOrMessage;


   /**
    * @type {string}
    */
   #playerUsername;


   /**
    * @type {import("@flooded-area-moderation-types/roblox").MultiGetByUsernameRequest<string>}
    */
   #playerData;


   /**
    * @type {number}
    */
   #menuIndex;


   /**
    * @type {boolean}
    */
   #hideModerator;


   /**
    * @type {number}
    */
   #selectedId;


   /**
    * @type {number}
    */
   #universeId;


   async #setPlayerData() {
      this.#playerData = await legacy.getUserByUsername(this.#playerUsername);
   };


   async #getAvatarHeadshot() {
      return await legacy.getAvatarHeadshotByUserId(this.#playerData.id, `720x720`, `Webp`);
   };


   /**
    * @returns {Promise<import("@flooded-area-moderation-types/moderations").ParsedModerationData[]>}
    */
   async #getApiModerationHistory() {
      const moderations = [];
      let nextPageToken;

      while (true) {
         const fetchedModerations = await cloud.getModerationLogs(this.#universeId, this.#playerData.id, undefined, nextPageToken);
         nextPageToken = fetchedModerations?.nextPageToken;

         if (fetchedModerations?.logs)
            moderations.push(...fetchedModerations.logs);

         if (!nextPageToken)
            break;
      };

      return moderations.map(moderation =>
         ({
            id: Date.parse(moderation.createTime),
            action: moderation.active
               ? moderation.duration
                  ? `temp-ban`
                  : `ban`
               : `revoke-ban`,
            length: moderation.duration
               ? +moderation.duration.slice(0, -1)
               : null,
            excludeAltAccounts: moderation.excludeAltAccounts,
            reason: {
               display: moderation.displayReason,
               private: moderation.privateReason
            },
            moderator: {
               roblox: +moderation.moderator.robloxUser
                  ?.split(`/`)
                  .at(-1)
            },
            message: {
               command: null,
               log: null
            }
         })
      );
   };


   /**
    * @returns {Promise<import("@flooded-area-moderation-types/moderations").ParsedModerationData[]>}
    */
   async #getDatabaseModerationHistory() {
      const moderationHistoryColRef  = this.#interactionOrMessage.client.firestore.collection(`universes`).doc(`${this.#universeId}`).collection(`players`).doc(`${this.#playerData.id}`).collection(`moderation-history`);
      const moderationHistoryColSnap = await moderationHistoryColRef.get();
      const moderationHistoryColDocs = moderationHistoryColSnap.docs;

      return moderationHistoryColDocs.map(moderationHistoryDocSnap => {
         const moderationHistoryDocData = moderationHistoryDocSnap.data();
         return {
            id: +moderationHistoryDocSnap.id,
            ...moderationHistoryDocData
         };
      });
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").ParsedModerationData[]} apiModerationHistory
    * @param {import("@flooded-area-moderation-types/moderations").ParsedModerationData[]} databaseModerationHistory
    */
   #getModerationHistory(apiModerationHistory, databaseModerationHistory) {
      const moderationHistory = databaseModerationHistory;

      for (const moderation of apiModerationHistory) {
         if (moderationHistory.some(moderationHistory => moderationHistory.id === moderation.id))
            continue;

         const insertAtIndex = moderationHistory.findIndex(moderationHistory => moderationHistory.id < moderation.id);
         moderationHistory.splice(insertAtIndex, 0, moderation);
      };

      moderationHistory.sort((a, b) => b.id - a.id);

      return moderationHistory;
   };


   /**
    * @param {string | number} robloxData
    */
   async #getPlayerDataFromRobloxData(robloxData) {
      switch (true) {
         case typeof robloxData === `string`: return await legacy.getUserByUsername(robloxData);
         case typeof robloxData === `number`: return await legacy.getUserByUserId(robloxData);
      };
   };


   /**
    * @param {string | number | null} robloxData
    */
   async #getFormattedPlayer(robloxData) {
      if (!robloxData) // no moderator
         return `Unknown`;

      const playerData = await this.#getPlayerDataFromRobloxData(robloxData);

      if (!playerData)
         return `Unknown`;

      else
         return Discord.hyperlink(
            `@${playerData.name}`,
            legacy.getUserProfileLinkFromUserId(playerData.id)
         );
   };


   /**
    * @param {Discord.Snowflake} guildId
    */
   #getLogsChannelId(guildId) {
      return config
         .find(config => config.discord.guildId === guildId)
         .discord.logs.channelId;
   };


   async #getCommandUser() {
      return this.#interactionOrMessage instanceof Discord.Message
         ? (await this.#interactionOrMessage.fetchReference()).author
         : this.#interactionOrMessage.user;
   };


   /**
    * @param {string | Discord.InteractionReplyOptions | Discord.MessagePayload | Discord.MessageReplyOptions} payload
    */
   async #editMessage(payload) {
      if (this.#interactionOrMessage instanceof Discord.Message)
         await this.#interactionOrMessage.edit(payload);
      else
         await this.#interactionOrMessage.editReply(payload);
   };


   async showModerationHistory() {
      // set player data
      await this.#setPlayerData();


      // get this player's avatar headshot
      const avatarHeadshot = await this.#getAvatarHeadshot();


      // get all moderation history of this player from the api
      const apiModerationHistory = await this.#getApiModerationHistory();


      // get moderation history from the database
      const databaseModerationHistory = await this.#getDatabaseModerationHistory();


      // merge moderation histories, allowing the database logs to have priority
      const moderationHistory = this.#getModerationHistory(apiModerationHistory, databaseModerationHistory);


      // no moderation history
      if (!moderationHistory.length)
         return await this.#editMessage({
            content: Discord.heading(`${this.#interactionOrMessage.client.allEmojis.error} ${Discord.hyperlink(`@${this.#playerData.name} (${this.#playerData.displayName})`, Discord.hideLinkEmbed(legacy.getUserProfileLinkFromUserId(this.#playerData.id)))} doesn't have any moderation history`, Discord.HeadingLevel.Three),
            allowedMentions: {
               repliedUser: false
            }
         });


      // menu
      const index = this.#menuIndex;
      const size = 25;
      const moderationHistoryPageToShow = moderationHistory.slice(index * size, size + (index * size));

      const pages = Math.ceil(moderationHistory.length / size);

      const moderationHistoryToShow = moderationHistoryPageToShow.find(moderationHistory => moderationHistory.id === this.#selectedId)
         || moderationHistoryPageToShow[0];


      // embeds
      const partialPlayerData = {
         ...moderationHistoryToShow,
         id: null,
         length: +moderationHistoryToShow.length,
         player: {
            id:          this.#playerData.id,
            displayName: this.#playerData.displayName,
            username:    this.#playerData.name,
            avatar:      avatarHeadshot?.imageUrl ?? null
         },
         reason:        undefined,
         displayReason: moderationHistoryToShow.reason.display,
         privateReason: moderationHistoryToShow.reason.private,
         moderator:     undefined,
         message:       undefined
      };

      const embeds = [
         (await this.#interactionOrMessage.client.moderations.formatPreModerationBotEmbed(this.#interactionOrMessage.guildId, partialPlayerData))
            .setDescription(null)
            .setTimestamp(moderationHistoryToShow.id)
      ];

      if (!this.#hideModerator) // add the moderator to the embed if we're not hiding the moderator
         embeds[0].spliceFields(
            embeds[0].data.fields.findIndex(field => !field.inline),
            0,
            {
               name: `Moderated By`,
               value: Discord.quote(
                  moderationHistoryToShow.moderator.discord
                     ? Discord.userMention(moderationHistoryToShow.moderator.discord)
                     : typeof moderationHistoryToShow.moderator.roblox === `string`
                        ? `@${moderationHistoryToShow.moderator.roblox}` // fallback for roblox api returning a player username (string)..? i don't remember....but it doesn't hurt to keep this in~ ;3
                        : await this.#getFormattedPlayer(moderationHistoryToShow.moderator.roblox)
               ),
               inline: true
            }
         );

      else // remove the moderator from the private ban reason (if this ban was from this app) if we're hiding the moderator
         if (moderationHistoryToShow.reason.private)
            embeds[0].spliceFields(
               embeds[0].data.fields.findIndex(field => field.name === `Private Ban Reason`),
               1,
               {
                  name: `Private Ban Reason`,
                  value: Discord.blockQuote(
                     moderationHistoryToShow.reason.private.endsWith(
                        modal.modalPrivateReasonAttribution(await this.#getCommandUser())
                     )
                        ? moderationHistoryToShow.reason.private
                           .slice(
                              0,
                              -modal.modalPrivateReasonAttribution(await this.#getCommandUser()).length
                           )
                           .trim()
                           || `Unknown`
                        : moderationHistoryToShow.reason.private
                           || `Unknown`
                  )
               }
            );


      // components
      const components = [
         new Discord.ActionRowBuilder()
            .setComponents(
               new Discord.StringSelectMenuBuilder()
                  .setCustomId(`moderation-history:${this.#playerUsername}:${index}:${this.#hideModerator}`)
                  .setPlaceholder(`Select a log`)
                  .setOptions(
                     moderationHistoryPageToShow.map(moderationHistory =>
                        new Discord.StringSelectMenuOptionBuilder()
                           .setLabel(
                              dayjs(moderationHistory.id).fromNow()
                           )
                           .setValue(`${moderationHistory.id}`)
                           .setDescription(moderationHistory.action)
                           .setEmoji(
                              this.#interactionOrMessage.client.moderations.getActionEmoji(moderationHistory.action)
                           )
                           .setDefault(moderationHistoryToShow.id === moderationHistory.id)
                     )
                  )
            ),

         new Discord.ActionRowBuilder()
            .setComponents(
               new Discord.ButtonBuilder()
                  .setLabel(
                     moderationHistoryToShow.message.log
                        ? `View log`
                        : `View approximate possible log location`
                  )
                  .setEmoji(this.#interactionOrMessage.client.allEmojis.polls)
                  .setStyle(Discord.ButtonStyle.Link)
                  .setURL(
                     moderationHistoryToShow.message.log
                        ?? Discord.messageLink(
                           this.#getLogsChannelId(this.#interactionOrMessage.guildId),
                           `${Discord.SnowflakeUtil.generate({ timestamp: moderationHistoryToShow.id })}`,
                           this.#interactionOrMessage.guildId
                        )
                  ),
               ...moderationHistoryToShow.message.command
                  ? [
                     new Discord.ButtonBuilder()
                        .setLabel(`View command`)
                        .setEmoji(this.#interactionOrMessage.client.allEmojis.integrations_channels_followed)
                        .setStyle(Discord.ButtonStyle.Link)
                        .setURL(moderationHistoryToShow.message.command)
                  ]
                  : []
            ),

         ...pages > 1
            ? [
               new Discord.ActionRowBuilder()
                  .setComponents(
                     new Discord.ButtonBuilder()
                        .setCustomId(`moderation-history:${this.#playerUsername}:${index - 1}:${this.#hideModerator}`)
                        .setEmoji(this.#interactionOrMessage.client.allEmojis.left)
                        .setStyle(Discord.ButtonStyle.Primary)
                        .setDisabled(index - 1 < 0),
                     new Discord.ButtonBuilder()
                        .setCustomId(`moderation-history:${this.#playerUsername}:${index + 1}:${this.#hideModerator}`)
                        .setEmoji(this.#interactionOrMessage.client.allEmojis.right)
                        .setStyle(Discord.ButtonStyle.Primary)
                        .setDisabled(index + 1 >= pages),
                     new Discord.ButtonBuilder()
                        .setCustomId(`🦊`)
                        .setLabel(`${index + 1} / ${pages}`)
                        .setStyle(Discord.ButtonStyle.Secondary)
                        .setDisabled(true)
                  )
            ]
            : []
      ];


      // edit the message
      await this.#editMessage({
         content: null,
         embeds,
         components,
         allowedMentions: {
            repliedUser: false
         }
      });
   };
};