import { getModerationHistory } from "../data/database.js";
import { bloxlink, legacy } from "../data/roblox.js";

import Discord from "discord.js";
import dayjs from "dayjs";
import { colours } from "@magicalbunny31/pawesome-utility-stuffs";


export default class ModerationsStatistics {
   /**
    * 📦 utilities for the moderation statistics command so i don't keep repeating my code (i hate that)
    */
   constructor(interactionOrMessage, selectedMenu = `7`) {
      this.#interactionOrMessage = interactionOrMessage;
      this.#selectedMenu = selectedMenu;
   };


   /**
    * @type {import("@flooded-area-moderation-types/client").ChatInputCommandInteraction | import("@flooded-area-moderation-types/client").StringSelectMenuInteraction | import("@flooded-area-moderation-types/client").Message}
    */
   #interactionOrMessage;


   /**
    * @type {import("@flooded-area-moderation-types/moderations").ModerationHistoryType}
    */
   #selectedMenu;


   /**
    * @type {Discord.User}
    */
   #commandUser;


   /**
    * @type {number}
    */
   #bloxlinkLinkedAccountPlayerId;


   #setCommandUser() {
      this.#commandUser = this.#interactionOrMessage instanceof Discord.Message
         ? this.#interactionOrMessage.author
         : this.#interactionOrMessage.user;
   };


   async #setBloxlinkLinkedAccountPlayerId() {
      this.#bloxlinkLinkedAccountPlayerId = +await bloxlink.discordToRoblox(this.#interactionOrMessage.guildId, this.#commandUser.id);
   };


   /**
    * @param {Discord.Snowflake} guildId
    * @returns {Promise<[ import("@flooded-area-moderation-types/moderations").Action, number ][]>}
    */
   async #getModeratedPlayers(guildId) {
      const universeId = this.#interactionOrMessage.client.moderations.getUniverseId(guildId);

      const moderatedPlayersDataStatistics = await getModerationHistory(this.#interactionOrMessage.client, universeId, this.#bloxlinkLinkedAccountPlayerId, this.#commandUser.id);

      return moderatedPlayersDataStatistics
         .map(moderatedPlayersDataStatistics => {
            if (!moderatedPlayersDataStatistics)
               return []; // the roblox list (at index 0) may be undefined, if it is then just return an empty list
            return moderatedPlayersDataStatistics
               .map(moderatedPlayersDataStatistics => {
                  switch (this.#selectedMenu) {
                     case `all`:
                        return [ moderatedPlayersDataStatistics.action, moderatedPlayersDataStatistics.playerId ];

                     default:
                        const moderationDate = dayjs(moderatedPlayersDataStatistics.id);
                        const inRange = dayjs().subtract(+this.#selectedMenu, `days`).isBefore(moderationDate);
                        if (!inRange)
                           return undefined; // this moderation is out of range for the menu, return undefined and .filter(Boolean) it after the .map() function
                        return [ moderatedPlayersDataStatistics.action, moderatedPlayersDataStatistics.playerId ];
                  };
               })
               .filter(Boolean);
         });
   };


   /**
    * @param {number[]} moderatedPlayers
    * @param {number} size
    */
   #getTopModerated(moderatedPlayers, size = 3) {
      const players = {};

      for (const moderatedPlayer of moderatedPlayers) {
         if (players[moderatedPlayer])
            players[moderatedPlayer] ++;
         else
            players[moderatedPlayer] = 1;
      };

      return Object.entries(players)
         .sort((a, b) => b[1] - a[1])
         .slice(0, size);
   };


   /**
    * @param {[ import("@flooded-area-moderation-types/moderations").Action, number ][]} moderatedPlayers
    * @param {import("@flooded-area-moderation-types/moderations").Action} action
    */
   #filterAction(moderatedPlayers, action) {
      return moderatedPlayers
         .filter(([ moderationAction ]) => moderationAction === action)
         .map(([ _action, playerId ]) => playerId);
   };


   /**
    * @param {[ import("@flooded-area-moderation-types/moderations").Action, number ][]} moderatedPlayersRoblox
    * @param {[ import("@flooded-area-moderation-types/moderations").Action, number ][]} moderatedPlayersDiscord
    */
   async #formatEmbed(moderatedPlayersRoblox, moderatedPlayersDiscord) {
      const moderatedPlayers = [ ...moderatedPlayersRoblox, ...moderatedPlayersDiscord ];

      const topModerated = this.#getTopModerated(moderatedPlayers.map(([ _action, playerId ]) => playerId));

      return new Discord.EmbedBuilder()
         .setColor(colours.flooded_area_moderation)
         .setAuthor({
            name: `${this.#commandUser.displayName} (@${this.#commandUser.username})`,
            iconURL: this.#commandUser.avatarURL({ extension: `webp`, size: 4096 })
         })
         .setDescription(
            [
               Discord.unorderedList([
                  `${Discord.inlineCode(moderatedPlayers.length)} moderations`,
                  [
                     `${Discord.inlineCode(moderatedPlayersRoblox.length)} from Roblox`,
                     `${Discord.inlineCode(moderatedPlayersDiscord.length)} from Discord`
                  ]
               ]),
               ...topModerated.length
                  ? [
                     Discord.unorderedList([ `Most moderated players` ]),
                     Discord.orderedList([ // this double list is intentional: it's to give it an extra indent to match the unorderedList above
                        await Promise.all(
                           topModerated.map(async ([ playerId, amount ]) => {
                              const playerData = await legacy.getUserByUserId(playerId);
                              return `${Discord.hyperlink(`${playerData.displayName} (@${playerData.name})`, Discord.hideLinkEmbed(legacy.getUserProfileLinkFromUserId(playerData.id)))} (${Discord.inlineCode(amount)} ${amount === 1 ? `time` : `times`})`;
                           })
                        )
                     ])
                  ]
                  : []
            ]
               .join(`\n`)
         )
         .setFields({
            name: `Bans`,
            value: Discord.unorderedList([
               `${Discord.inlineCode(this.#filterAction(moderatedPlayers, `ban`).length)} bans`,
               [
                  `${Discord.inlineCode(this.#filterAction(moderatedPlayersRoblox, `ban`).length)} from Roblox`,
                  `${Discord.inlineCode(this.#filterAction(moderatedPlayersDiscord, `ban`).length)} from Discord`
               ]
            ]),
            inline: true
         }, {
            name: `Temporary Bans`,
            value: Discord.unorderedList([
               `${Discord.inlineCode(this.#filterAction(moderatedPlayers, `temp-ban`).length)} temporary bans`,
               [
                  `${Discord.inlineCode(this.#filterAction(moderatedPlayersRoblox, `temp-ban`).length)} from Roblox`,
                  `${Discord.inlineCode(this.#filterAction(moderatedPlayersDiscord, `temp-ban`).length)} from Discord`
               ]
            ]),
            inline: true
         }, {
            name: `Revoked Bans`,
            value: Discord.unorderedList([
               `${Discord.inlineCode(this.#filterAction(moderatedPlayers, `revoke-ban`).length)} bans revoked`,
               [
                  `${Discord.inlineCode(this.#filterAction(moderatedPlayersRoblox, `revoke-ban`).length)} from Roblox`,
                  `${Discord.inlineCode(this.#filterAction(moderatedPlayersDiscord, `revoke-ban`).length)} from Discord`
               ]
            ]),
            inline: true
         })
         .setTimestamp()
         .setFooter({
            text: `This information is unreliable and shouldn't be taken as fact.`
         });
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


   async showModerationStatistics() {
      // set command user
      this.#setCommandUser();


      // set bloxlink lined account player id
      await this.#setBloxlinkLinkedAccountPlayerId();


      // get database entries
      const [ moderatedPlayersRoblox, moderatedPlayersDiscord ] = await this.#getModeratedPlayers(this.#interactionOrMessage.guildId);


      // embeds
      const embeds = [
         await this.#formatEmbed(moderatedPlayersRoblox, moderatedPlayersDiscord)
      ];


      // components
      const components = [
         new Discord.ActionRowBuilder()
            .setComponents(
               new Discord.StringSelectMenuBuilder()
                  .setCustomId(`moderation-statistics`)
                  .setPlaceholder(`Select a period`)
                  .setOptions(
                     new Discord.StringSelectMenuOptionBuilder()
                        .setLabel(`7-day period`)
                        .setValue(`7`)
                        .setEmoji(this.#interactionOrMessage.client.allEmojis.time)
                        .setDefault(this.#selectedMenu === `7`),
                     new Discord.StringSelectMenuOptionBuilder()
                        .setLabel(`30-day period`)
                        .setValue(`30`)
                        .setEmoji(this.#interactionOrMessage.client.allEmojis.scheduled_events)
                        .setDefault(this.#selectedMenu === `30`),
                     new Discord.StringSelectMenuOptionBuilder()
                        .setLabel(`All-time`)
                        .setValue(`all`)
                        .setEmoji(this.#interactionOrMessage.client.allEmojis.subscription_levels)
                        .setDefault(this.#selectedMenu === `all`)
                  )
            ),

         ...this.#bloxlinkLinkedAccountPlayerId
            ? [
               new Discord.ActionRowBuilder()
                  .setComponents(
                     new Discord.ButtonBuilder()
                        .setLabel(`Linked Bloxlink Account`)
                        .setEmoji(this.#interactionOrMessage.client.allEmojis.integrations_channels_followed)
                        .setStyle(Discord.ButtonStyle.Link)
                        .setURL(legacy.getUserProfileLinkFromUserId(this.#bloxlinkLinkedAccountPlayerId))
                  )
            ]
            : []
      ];


      // edit the message
      await this.#editMessage({
         embeds,
         components,
         allowedMentions: {
            repliedUser: false
         }
      });
   };
};