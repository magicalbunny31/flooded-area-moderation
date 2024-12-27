import { legacy, cloud } from "../data/roblox.js";

import Discord from "discord.js";
import dayjs from "dayjs";


export default class ActiveModerations {
   /**
    * 📦 utilities for the moderation statistics command so i don't keep repeating my code (i hate that)
    */
   constructor(interactionOrMessage, selectedPlayerIndex = 0, selectedFilters = [ `ban`, `temp-ban` ], menuIndex = 0) {
      this.#interactionOrMessage = interactionOrMessage;
      this.#selectedPlayerIndex = selectedPlayerIndex;
      this.#selectedFilters = selectedFilters;
      this.#menuIndex = menuIndex;
   };


   /**
    * @type {import("@flooded-area-moderation-types/client").ChatInputCommandInteraction | import("@flooded-area-moderation-types/client").ButtonInteraction | import("@flooded-area-moderation-types/client").StringSelectMenuInteraction | import("@flooded-area-moderation-types/client").Message}
    */
   #interactionOrMessage;


   /**
    * @type {number}
    */
   #selectedPlayerIndex;


   /**
    * @type {("ban" | "temp-ban")[]}
    */
   #selectedFilters;


   /**
    * @type {number}
    */
   #menuIndex;



   /**
    * @param {string} startTime
    */
   #getModeratedAtTimestamp(startTime) {
      return Date.parse(startTime);
   };


   /**
    * @param {number} universeId
    * @returns {Promise<import("@flooded-area-moderation-types/roblox").UserRestriction[]>}
    */
   async #getActiveModerations(universeId) {
      // get all moderations from the roblox api
      const moderations = [];
      let nextPageToken;

      while (true) {
         const fetchedModerations = await cloud.listModerations(universeId, undefined, true, nextPageToken);
         nextPageToken = fetchedModerations?.nextPageToken;

         if (fetchedModerations?.userRestrictions)
            moderations.push(...fetchedModerations.userRestrictions);

         if (!nextPageToken)
            break;
      };


      // filter these moderations based on the filter
      const filteredModerations = [];

      for (const moderation of moderations.filter(moderation => moderation.gameJoinRestriction.active)) { // some recently expired moderations will still come up in this array: filter them out
         if (this.#selectedFilters.includes(`ban`) && !moderation.gameJoinRestriction.duration)
            filteredModerations.push(moderation);

         if (this.#selectedFilters.includes(`temp-ban`) && moderation.gameJoinRestriction.duration)
            filteredModerations.push(moderation);
      };


      // return these moderations
      return filteredModerations;
   };


   /**
    * @param {number} playerId
    */
   async #getPlayerData(playerId) {
      if (!playerId)
         return undefined;

      return await legacy.getUserByUserId(playerId);
   };


   /**
    * @param {number} playerId
    */
   async #getAvatarHeadshot(playerId) {
      if (!playerId)
         return undefined;

      return await legacy.getAvatarHeadshotByUserId(playerId, `720x720`, `Webp`);
   };


   /**
    * @param {import("@flooded-area-moderation-types/roblox").UserRestriction} userRestrictionLog
    */
   #getAction(userRestriction) {
      if (userRestriction?.gameJoinRestriction.duration)
         return `temp-ban`;
      else
         return `ban`;
   };


   /**
    * @param {string | Discord.InteractionReplyOptions | Discord.MessagePayload | Discord.MessageReplyOptions} payload
    */
   async #editMessage(payload) {
      if (this.#interactionOrMessage instanceof Discord.Message)
         await this.#interactionOrMessage.reply(payload);
      else
         await this.#interactionOrMessage.editReply(payload);
   };


   async showActiveModerations() {
      // get all active moderations of this universe
      const universeId = this.#interactionOrMessage.client.moderations.getUniverseId(this.#interactionOrMessage.guildId);

      const activeModerations = await this.#getActiveModerations(universeId);


      // menu
      const index = this.#menuIndex;
      const size = 25;
      const moderationHistoryPageToShow = activeModerations.slice(index * size, size + (index * size));

      const pages = Math.ceil(activeModerations.length / size);

      const moderationHistoryToShow = moderationHistoryPageToShow[this.#selectedPlayerIndex];


      // get player data for the selectedPlayerIndex
      const playerId = +moderationHistoryToShow?.user.split(`/`)[1];

      const playerData = await this.#getPlayerData(playerId);

      const avatarHeadshot = await this.#getAvatarHeadshot(playerId);

      const moderatedAtTimestamp = this.#getModeratedAtTimestamp(moderationHistoryToShow?.gameJoinRestriction.startTime);


      // embeds
      const partialPlayerData = {
         action: this.#getAction(moderationHistoryToShow),
         length: +moderationHistoryToShow?.gameJoinRestriction.duration?.slice(0, -1) || undefined,
         excludeAltAccounts: moderationHistoryToShow?.gameJoinRestriction.excludeAltAccounts,
         player: {
            id:          playerData?.id,
            displayName: playerData?.displayName,
            username:    playerData?.name,
            avatar:      avatarHeadshot?.imageUrl ?? null
         },
         displayReason: moderationHistoryToShow?.gameJoinRestriction.displayReason,
         privateReason: moderationHistoryToShow?.gameJoinRestriction.privateReason
      };

      const embeds = moderationHistoryToShow
         ? [
            (await this.#interactionOrMessage.client.moderations.formatPreModerationBotEmbed(this.#interactionOrMessage.guildId, partialPlayerData))
               .setDescription(null)
               .setTimestamp(moderatedAtTimestamp)
         ]
         : [];


      // components
      const components = [
         new Discord.ActionRowBuilder()
            .setComponents(
               new Discord.StringSelectMenuBuilder()
                  .setCustomId(`active-moderations:${index}`)
                  .setPlaceholder(`Select a log`)
                  .setOptions(
                     moderationHistoryPageToShow.length
                        ? await Promise.all(
                           moderationHistoryPageToShow.map(async (moderationHistory, i) => {
                              const playerId = +moderationHistory.user.split(`/`)[1];
                              const playerData = await this.#getPlayerData(playerId);
                              return new Discord.StringSelectMenuOptionBuilder()
                                 .setLabel(
                                    dayjs(
                                       this.#getModeratedAtTimestamp(moderationHistory.gameJoinRestriction.startTime)
                                    ).fromNow()
                                 )
                                 .setValue(`${i}`)
                                 .setDescription(
                                    [
                                       this.#getAction(moderationHistory),
                                       ...playerData
                                          ? [ `${playerData.displayName} (@${playerData.name})` ]
                                          : []
                                    ]
                                    .join(`, `)
                                 )
                                 .setEmoji(
                                    this.#interactionOrMessage.client.moderations.getActionEmoji(
                                       this.#getAction(moderationHistory)
                                    )
                                 )
                                 .setDefault(this.#getModeratedAtTimestamp(moderationHistory.gameJoinRestriction.startTime) === moderatedAtTimestamp);
                           })
                        )
                        : new Discord.StringSelectMenuOptionBuilder()
                           .setLabel(`🦊`)
                           .setValue(`🦊`)
                  )
                  .setDisabled(!moderationHistoryPageToShow.length)
            ),

         new Discord.ActionRowBuilder()
            .setComponents(
               new Discord.StringSelectMenuBuilder()
                  .setCustomId(`active-moderations:selected-filters`)
                  .setPlaceholder(`Select filters`)
                  .setMinValues(1)
                  .setMaxValues(2)
                  .setOptions(
                     new Discord.StringSelectMenuOptionBuilder()
                        .setLabel(`Bans`)
                        .setValue(`ban`)
                        .setEmoji(this.#interactionOrMessage.client.moderations.getActionEmoji(`ban`))
                        .setDefault(this.#selectedFilters.includes(`ban`)),
                     new Discord.StringSelectMenuOptionBuilder()
                        .setLabel(`Temporary Bans`)
                        .setValue(`temp-ban`)
                        .setEmoji(this.#interactionOrMessage.client.moderations.getActionEmoji(`temp-ban`))
                        .setDefault(this.#selectedFilters.includes(`temp-ban`))
                  )
            ),

         ...pages > 1
            ? [
               new Discord.ActionRowBuilder()
                  .setComponents(
                     new Discord.ButtonBuilder()
                        .setCustomId(`active-moderations:${index - 1}`)
                        .setEmoji(this.#interactionOrMessage.client.allEmojis.left)
                        .setStyle(Discord.ButtonStyle.Primary)
                        .setDisabled(index - 1 < 0),
                     new Discord.ButtonBuilder()
                        .setCustomId(`active-moderations:${index + 1}`)
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
         content: moderationHistoryPageToShow.length
            ? null
            : Discord.heading(`${this.#interactionOrMessage.client.allEmojis.warning} No moderations match your filter`, Discord.HeadingLevel.Three),
         embeds,
         components,
         allowedMentions: {
            repliedUser: false
         }
      });
   };
};