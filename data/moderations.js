import { content, modal, defaultBanReason } from "./defaults.js";
import discordData from "./discord.js";
import experiences from "./experiences.js";
import formatDuration, { toSeconds } from "./format-duration.js";
import { prefix } from "./message-commands.js";
import { bloxlink, legacy, cloud } from "./roblox.js";

import Discord from "discord.js";
import dayjs from "dayjs";
import ping from "ping";
import { setIntervalAsync, clearIntervalAsync } from "set-interval-async/fixed";
import { colours, respondToWrongUserMessageComponentInteraction } from "@magicalbunny31/pawesome-utility-stuffs";


export class ModerationsManager {
   /**
    * 📦 the `ModerationsManager` is a queue-like system which ensures that requests to the APIs are sent sequentially with adequate delay between requests in order to reduce API abuse
    *
    * 💫 holy buzzword
    */
   constructor(client) {
      this.#client = client;
   };


   /**
    * @type {import("@flooded-area-moderation-types/client").default}
    */
   #client;


   /**
    * @type {import("@flooded-area-moderation-types/moderations").ProcessedModerationData[]}
    */
   #moderations = [];


   /**
    * @type {ReturnType<typeof setIntervalAsync>}
    */
   #moderationsTimer;


   #colours = {
      green:  0xaeff00,
      orange: 0xff9100,
      red:    0xff3c00
   };


   async #robloxIsOnline() {
      try {
         const hostname = `apis.roblox.com`;
         const response = await ping.promise.probe(hostname);
         return response.alive;

      } catch (error) {
         return false;
      };
   };


   /**
    * @param {Discord.Snowflake} guildId
    */
   getUniverseId(guildId) {
      return experiences
         .find(experience => experience.guild.guildIds.includes(guildId))
         .experience
         .universeId;
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationData} processedModeration
    */
   async #moderatePlayer(processedModeration) {
      const universeId = this.getUniverseId(processedModeration.message.guildId);

      switch (processedModeration.action) {
         case `ban`:
            return await cloud.banUser      (universeId, processedModeration.player.id, undefined,                  processedModeration.privateReason, processedModeration.displayReason, processedModeration.excludeAltAccounts);
         case `temp-ban`:
            return await cloud.banUser      (universeId, processedModeration.player.id, processedModeration.length, processedModeration.privateReason, processedModeration.displayReason, processedModeration.excludeAltAccounts);
         case `revoke-ban`:
            return await cloud.revokeUserBan(universeId, processedModeration.player.id);
      };
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").Action} action
    */
   #getPostModerationBotEmbedDescription(action) {
      switch (action) {
         case `ban`:
         case `temp-ban`:   return `${this.#client.allEmojis.success} Banned player!`;
         case `revoke-ban`: return `${this.#client.allEmojis.success} Revoked player's ban!`;
      };
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationData} processedModeration
    * @param {string} messageLogUrl
    */
   async #formatPostModerationBotEmbed(processedModeration, messageLogUrl) {
      const baseEmbed = await this.formatPreModerationBotEmbed(processedModeration.message.guildId, processedModeration);

      return baseEmbed
         .setDescription(
            [
               Discord.heading(this.#getPostModerationBotEmbedDescription(processedModeration.action), Discord.HeadingLevel.Three),
               messageLogUrl
            ]
               .join(`\n`)
         );
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationData} processedModeration
    */
   async #formatPostModerationErrorBotEmbed(processedModeration) {
      const baseEmbed = await this.formatPreModerationBotEmbed(processedModeration.message.guildId, processedModeration);

      return baseEmbed
         .setColor(colours.flooded_area_moderation)
         .setDescription(
            [
               Discord.heading(`${this.#client.allEmojis.error} Failed to moderate player`, Discord.HeadingLevel.Three),
               `Try banning this player again.`
            ]
               .join(`\n`)
         );
   };


   /**
    * @param {import("@flooded-area-moderation-types/client").Message} message
    * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationData} processedModeration
    * @param {Discord.EmbedBuilder} embed
    */
   #replaceEmbed(message, processedModeration, embed) {
      const embeds = message.embeds;
      const embedIndex = processedModeration.message.embedIndex;

      embeds.splice(embedIndex, 1, embed);

      return embeds;
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").Action} action
    */
   #getPostModerationLogEmbedTitle(action) {
      switch (action) {
         case `ban`:        return `Player Banned`;
         case `temp-ban`:   return `Player Temp-banned`;
         case `revoke-ban`: return `Player Unbanned`;
      };
   };


   /**
    * @param {string} string
    */
   #replaceNewline(string) {
      return string.replace(/[\r\n]+/g, ` `).trim();
   };


   /**
    * @param {string} string
    * @param {boolean} isPrivateReason
    */
   #getPostModerationLogEmbedReason(string, isPrivateReason) {
      return isPrivateReason
         ? this.#replaceNewline(string.slice(0, string.lastIndexOf(`\n\n`)))
         : this.#replaceNewline(string);
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationData} processedModeration
    */
   #formatPostModerationLogEmbed(processedModeration) {
      return new Discord.EmbedBuilder()
         .setColor(
            this.#getEmbedColour(processedModeration.action)
         )
         .setTitle(
            this.#getPostModerationLogEmbedTitle(processedModeration.action)
         )
         .setDescription(
            [
               Discord.quote(`Username: @${processedModeration.player.username}`),
               Discord.quote(`ID: ${processedModeration.player.id}`),
               ``,
               ...processedModeration.action === `revoke-ban`
                  ? []
                  : [
                     Discord.quote(`Reason: ${Discord.inlineCode(this.#getPostModerationLogEmbedReason(processedModeration.displayReason, false))}`),
                     Discord.quote(`Private Reason: ${Discord.inlineCode(this.#getPostModerationLogEmbedReason(processedModeration.privateReason, true))}`)
                  ],
               ...processedModeration.action === `temp-ban`
                  ? [ Discord.quote(`Duration: ${processedModeration.length} seconds`) ]
                  : []
            ]
               .join(`\n`)
         )
         .setFooter({
            text: `Discord Moderator: @${processedModeration.discordModerator.username}`
         });
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationData} processedModeration
    */
   async #isBanned(processedModeration) {
      const universeId = this.getUniverseId(processedModeration.message.guildId);
      const playerId = processedModeration.player.id;

      const userRestriction = await cloud.getUserRestriction(universeId, playerId);

      return !!userRestriction?.gameJoinRestriction.active;
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationData} processedModeration
    */
   async #formatPostModerationNotBannedBotEmbed(processedModeration) {
      const baseEmbed = await this.formatPreModerationBotEmbed(processedModeration.message.guildId, processedModeration);

      return baseEmbed
         .setColor(colours.flooded_area_moderation)
         .setDescription(
            [
               Discord.heading(`${this.#client.allEmojis.error} Player isn't banned`, Discord.HeadingLevel.Three),
               `You can't revoke ${Discord.hyperlink(`${processedModeration.player.displayName} (@${processedModeration.player.username})`, legacy.getUserProfileLinkFromUserId(processedModeration.player.id))}'s ban as they aren't yet banned.`
            ]
               .join(`\n`)
         );
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationData} processedModeration
    * @return {Promise<{ [commandName: string]: Discord.Snowflake }>}
    */
   async #getApplicationCommands(processedModeration) {
      const guild = await this.#client.guilds.fetch(processedModeration.message.guildId);
      const fetchedApplicationCommands = await guild.commands.fetch();
      return fetchedApplicationCommands.reduce((acc, applicationCommand) => {
         acc[applicationCommand.name] = applicationCommand.id;
         return acc;
      }, {});
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationData} processedModeration
    * @param {string} messageLogUrl
    */
   async #formatPostModerationLogFailedBotEmbed(processedModeration, messageLogUrl) {
      const baseEmbed = await this.formatPreModerationBotEmbed(processedModeration.message.guildId, processedModeration);

      const embedDescription = this.#getPostModerationBotEmbedDescription(processedModeration.action)
         .replace(this.#client.allEmojis.success, this.#client.allEmojis.warning)
         .slice(0, -1);

      const commands = await this.#getApplicationCommands(processedModeration);

      return baseEmbed
         .setColor(colours.flooded_area_moderation)
         .setDescription(
            [
               Discord.heading(`${embedDescription}; failed to add to their moderation history`, Discord.HeadingLevel.Three),
               messageLogUrl,
               `This moderation may not show up when viewing ${Discord.hyperlink(`${processedModeration.player.displayName} (@${processedModeration.player.username})`, legacy.getUserProfileLinkFromUserId(processedModeration.player.id))}'s ${this.#client.allEmojis.slash_command} ${Discord.chatInputApplicationCommandMention(`moderation-history`, commands[`moderation-history`])}.`
            ]
               .join(`\n`)
         );
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationData} processedModeration
    */
   async #logModeration(processedModeration) {
      const logsWebhookUrl = discordData
         .find(discordData => discordData.guildId === processedModeration.message.guildId)
         .logs
         .webhookUrl;

      const webhookClient = new Discord.WebhookClient({
         url: logsWebhookUrl
      });

      const embeds = [
         this.#formatPostModerationLogEmbed(processedModeration)
      ];

      return await webhookClient.send({
         avatarURL: this.#client.user.avatarURL({ extension: `webp`, size: 4096 }),
         username: this.#client.user.username,
         embeds
      });
   };


   /**
    * @param {import("@flooded-area-moderation-types/roblox").UserRestriction} userRestriction
    */
   async #getModerationStartTime(userRestriction) {
      const [ _universes, universeId, _userRestrictions, playerId ] = userRestriction.path.split(`/`);

      const fetchedModerations = await cloud.getModerationLogs(+universeId, +playerId);

      const foundModeration = fetchedModerations?.logs[0]?.createTime;

      return foundModeration;
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationData} processedModeration
    * @param {import("@flooded-area-moderation-types/roblox").UserRestriction} userRestriction
    * @param {string} messageCommandUrl
    * @param {string} messageLogUrl
    */
   async #logModerationHistory(processedModeration, userRestriction, messageCommandUrl, messageLogUrl) {
      const moderatedAt = userRestriction.gameJoinRestriction.startTime
         || await this.#getModerationStartTime(userRestriction);

      if (!moderatedAt)
         return false;

      const timestamp = Date.parse(moderatedAt);

      const universeId = this.getUniverseId(processedModeration.message.guildId);

      const moderationHistoryDocRef = this.#client.firestore.collection(`universes`).doc(`${universeId}`).collection(`players`).doc(`${processedModeration.player.id}`).collection(`moderation-history`).doc(`${timestamp}`);
      await moderationHistoryDocRef.set({
         action: processedModeration.action,
         length: processedModeration.length ?? null,
         excludeAltAccounts: processedModeration.excludeAltAccounts ?? null,
         reason: {
            display: processedModeration.displayReason ?? null,
            private: processedModeration.privateReason ?? null
         },
         moderator: {
            discord: processedModeration.discordModerator.id
         },
         message: {
            command: messageCommandUrl,
            log: messageLogUrl
         }
      });

      return true;
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationData} processedModeration
    */
   async #processModeration(processedModeration) {
      // get the command response
      const commandResponseChannel = await this.#client.channels.fetch(processedModeration.message.channelId);
      const commandResponseMessage = await commandResponseChannel.messages.fetch(processedModeration.message.messageId);


      // this is a revoke ban and this player isn't currently banned
      const isRevokeBan = processedModeration.action === `revoke-ban`;
      const isBanned = await this.#isBanned(processedModeration);

      if (isRevokeBan && !isBanned) {
         const embeds = this.#replaceEmbed(
            commandResponseMessage,
            processedModeration,
            await this.#formatPostModerationNotBannedBotEmbed(processedModeration)
         );

         return void await commandResponseMessage.edit({
            embeds,
            allowedMentions: {
               repliedUser: false
            }
         });
      };


      // send a request to roblox's open cloud api to moderate this player
      const userRestriction = await this.#moderatePlayer(processedModeration);


      // failed to moderate this player
      if (!userRestriction) {
         const embeds = this.#replaceEmbed(
            commandResponseMessage,
            processedModeration,
            await this.#formatPostModerationErrorBotEmbed(processedModeration)
         );

         return void await commandResponseMessage.edit({
            embeds,
            allowedMentions: {
               repliedUser: false
            }
         });
      };


      // send webhook message
      const logMessage = await this.#logModeration(processedModeration);


      // add to this player's moderation history
      const messageCommandUrl = Discord.messageLink(processedModeration.message.channelId, processedModeration.message.messageId, commandResponseChannel.guildId);
      const messageLogUrl     = Discord.messageLink(logMessage.channel_id, logMessage.id, commandResponseChannel.guildId);

      const logModerationHistorySuccess = await this.#logModerationHistory(processedModeration, userRestriction, messageCommandUrl, messageLogUrl);


      // couldn't add to this player's moderation history
      if (!logModerationHistorySuccess) {
         const embeds = this.#replaceEmbed(
            commandResponseMessage,
            processedModeration,
            await this.#formatPostModerationLogFailedBotEmbed(processedModeration, messageLogUrl)
         );

         return void await commandResponseMessage.edit({
            embeds,
            allowedMentions: {
               repliedUser: false
            }
         });
      };


      // update the message to show that this player has been moderated
      const embeds = this.#replaceEmbed(
         commandResponseMessage,
         processedModeration,
         await this.#formatPostModerationBotEmbed(processedModeration, messageLogUrl)
      );

      await commandResponseMessage.edit({
         embeds,
         allowedMentions: {
            repliedUser: false
         }
      });
   };


   /**
    * ✨ start processing the `ModerationsManager.moderations` queue
    */
   start() {
      // already started
      if (this.#moderationsTimer)
         throw new Error(`🚫 ModerationsManager.start() already run`);

      const intervalFunction = async () => {
         // get the latest moderation and remove it
         const moderationData = this.#moderations.shift();

         // process this moderation
         if (moderationData)
            await this.#processModeration(moderationData);
      };

      // run methods every 5 seconds
      const FiveSeconds = 5 * 1000;
      this.#moderationsTimer = setIntervalAsync(intervalFunction, FiveSeconds);

      // return self
      return this;
   };


   /**
    * 🛑 stop processing the `ModerationsManager.moderations` queue
    */
   stop() {
      // not yet started
      if (this.#moderationsTimer)
         throw new Error(`🚫 ModerationsManager.start() not yet run`);

      clearIntervalAsync(this.#moderationsTimer);
   };


   /**
    * @param {import("@flooded-area-moderation-types/client").Message} message
    */
   async #getModerator(message) {
      return message.interactionMetadata?.user
         ?? (await message.fetchReference()).author;
   };


   /**
    * @param {import("@flooded-area-moderation-types/client").Message} message
    * @return {Promise<string?>}
    */
   #collectPrompt(message) {
      // a Promise is used here to return data inside the interaction collector event handlers
      return new Promise(async (resolve, reject) => {


         // the interaction collector
         const moderator = await this.#getModerator(message);

         const interactionCollector = message.createMessageComponentCollector({
            componentType: Discord.ComponentType.StringSelect,
            filter: i => i.customId.startsWith(message.id),
            time: 5 * 60 * 1000 // 5 minutes
         });


         // on string select menu select..
         interactionCollector.on(`collect`, async selectMenuInteraction => {
            // not the expected user
            if (selectMenuInteraction.user.id !== moderator.id)
               return await respondToWrongUserMessageComponentInteraction(selectMenuInteraction, moderator, selectMenuInteraction.user);

            // update the interaction's reply
            await selectMenuInteraction.update({
               content: Discord.heading(`${this.#client.allEmojis.loading} ${content.fetchingPlayerData}`, Discord.HeadingLevel.Three),
               components: []
            });

            // stop the interaction collector
            interactionCollector.stop(`selected value`);

            // return the selected value
            const [ value ] = selectMenuInteraction.values;
            resolve(value);
         });


         // when the string select menu ends..
         interactionCollector.on(`end`, async (_collected, reason) => {
            switch (reason) {
               case `selected value`:
                  break;

               case `time`: {
                  await message.edit({
                     content: Discord.heading(`${this.#client.allEmojis.error} ${content.timedOut}`, Discord.HeadingLevel.Three),
                     components: [],
                     allowedMentions: {
                        repliedUser: false
                     }
                  });

                  resolve();
                  break;
               };

               default:
                  reject(`.collectPrompt() InteractionCollector ended with reason: ${reason}`);
                  break;
            };
         });


      });
   };


   /**
    * @type {import("@flooded-area-moderation-types/moderations").resolvePlayerData}
    */
   async #promptSelectPlayerData(message, playerDataIfId, playerDataIfUsername) {
      // the inputted player: assume that `playerDataIfUsername` was the original input
      const username = playerDataIfUsername.name;


      // prompt the user
      const components = [
         new Discord.ActionRowBuilder()
            .setComponents(
               new Discord.StringSelectMenuBuilder()
                  .setCustomId(`${message.id}:select-player`)
                  .setPlaceholder(`Select a player`)
                  .setOptions(
                     new Discord.StringSelectMenuOptionBuilder()
                        .setLabel(`Roblox username`)
                        .setValue(`${playerDataIfUsername.id}`)
                        .setDescription(`${playerDataIfUsername.displayName} (@${playerDataIfUsername.name})`)
                        .setEmoji(this.#client.allEmojis.people),
                     new Discord.StringSelectMenuOptionBuilder()
                        .setLabel(`Player id`)
                        .setValue(`${playerDataIfId.id}`)
                        .setDescription(`${playerDataIfId.displayName} (@${playerDataIfId.name})`)
                        .setEmoji(this.#client.allEmojis.id)
                  )
            )
      ];

      await message.edit({
         content: Discord.heading(`${this.#client.allEmojis.warning} Is "@${username}" a ${Discord.bold(`Roblox username`)} or ${Discord.bold(`Player id`)}?`, Discord.HeadingLevel.Three),
         components,
         allowedMentions: {
            repliedUser: false,
            parse: []
         }
      });


      // get the player id that this moderator selects, if nothing was returned then the menu likely timed out
      const selectedRawPlayerId = await this.#collectPrompt(message);

      if (!selectedRawPlayerId)
         return;


      // return the selected player
      const selectedPlayerId = +selectedRawPlayerId;

      return selectedPlayerId === playerDataIfId.id
         ? playerDataIfId
         : playerDataIfUsername;
   };


   /**
    * @type {import("@flooded-area-moderation-types/moderations").resolvePlayerData}
    */
   async resolvePlayerData(message, playerDataIfId, playerDataIfUsername) {
      return playerDataIfId && playerDataIfUsername
         ? await this.#promptSelectPlayerData(message, playerDataIfId, playerDataIfUsername) // this username could also be an id, prompt the moderator
         : playerDataIfId || playerDataIfUsername;                                           // one of these is a username or id, if neither are then `undefined` is returned
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").PartialPlayerData} playerData
    */
   getRobloxPlayerBaseEmbed(playerData) {
      return new Discord.EmbedBuilder()
         .setAuthor({
            name: `${playerData.displayName} (@${playerData.name || playerData.username})`,
            url: legacy.getUserProfileLinkFromUserId(playerData.id),
            iconURL: playerData.avatar
         });
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").Action} action
    */
   #getEmbedColour(action) {
      switch (action) {
         case `ban`:        return this.#colours.red;
         case `temp-ban`:   return this.#colours.orange;
         case `revoke-ban`: return this.#colours.green;
      };
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").Action} action
    */
   #getPreModerationBotEmbedDescription(action) {
      switch (action) {
         case `ban`:
         case `temp-ban`:   return `${this.#client.allEmojis.loading} Banning player...`;
         case `revoke-ban`: return `${this.#client.allEmojis.loading} Revoking player's ban...`;
      };
   };


   /**
    * @param {Discord.Snowflake} guildId
    * @param {import("@flooded-area-moderation-types/moderations").PartialModerationData} processedModeration
    */
   async formatPreModerationBotEmbed(guildId, processedModeration) {
      const memberIds = await bloxlink.robloxToDiscord(guildId, processedModeration.player.id) || [];

      return this.getRobloxPlayerBaseEmbed(processedModeration.player)
         .setColor(
            this.#getEmbedColour(processedModeration.action)
         )
         .setDescription(
            Discord.heading(this.#getPreModerationBotEmbedDescription(processedModeration.action), Discord.HeadingLevel.Three)
         )
         .setFields(
            ...processedModeration.length
               ? [{
                  name: `Length`,
                  value: Discord.quote(formatDuration(processedModeration.length)),
                  inline: true
               }]
               : [],
            ...processedModeration.action !== `revoke-ban`
               ? [{
                  name: `Ban Alt Accounts`,
                  value: Discord.quote(
                     !processedModeration.excludeAltAccounts
                        ? `Yes`
                        : `No`
                  ),
                  inline: true
               }]
               : [],
            ...memberIds.length
               ? [{
                  name: memberIds.length === 1
                     ? `Linked Bloxlink Account`
                     : `Linked Bloxlink Accounts`,
                  value: Discord.quote(
                     memberIds.map(memberId =>
                        Discord.userMention(memberId)
                     )
                  ),
                  inline: true
               }]
               : [],
            ...processedModeration.action !== `revoke-ban`
               ? [{
                  name: `Public Ban Reason`,
                  value: Discord.blockQuote(processedModeration.displayReason || `Unknown`), // escaping markdown is out of the clause of acceptable reasons..
                  inline: false
               }, {
                  name: `Private Ban Reason`,
                  value: Discord.blockQuote(processedModeration.privateReason || `Unknown`), // escaping markdown is out of the clause of acceptable reasons..
                  inline: false
               }]
               : []

         )
         .setFooter({
            text: processedModeration.action
         });
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").Action} action
    */
   getActionEmoji(action) {
      switch (action) {
         case `ban`:
         case `temp-ban`:   return this.#client.allEmojis.people_remove;
         case `revoke-ban`: return this.#client.allEmojis.people_add;
      };
   };


   /**
    * @param {import("@flooded-area-moderation-types/client").Message} message
    * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationData} processedModeration
    * @param {number} length
    */
   async #promptModerationAction(message, processedModeration, length) {
      // prompt the user
      const embeds = [
         (await this.formatPreModerationBotEmbed(message.guildId, { ...processedModeration, length }))
            .setDescription(null)
      ];

      const components = [
         new Discord.ActionRowBuilder()
            .setComponents(
               new Discord.StringSelectMenuBuilder()
                  .setCustomId(`${message.id}:select-action`)
                  .setPlaceholder(`Select an action`)
                  .setOptions(
                     new Discord.StringSelectMenuOptionBuilder()
                        .setLabel(`Permanent ban`)
                        .setValue(`ban`)
                        .setEmoji(this.getActionEmoji(`ban`)),
                     new Discord.StringSelectMenuOptionBuilder()
                        .setLabel(`Temporary ban`)
                        .setValue(`temp-ban`)
                        .setDescription(formatDuration(length))
                        .setEmoji(this.getActionEmoji(`temp-ban`))
                  )
            )
      ];

      await message.edit({
         content: [
            Discord.heading(`${this.#client.allEmojis.warning} Did you mean to ${Discord.underline(`temporarily`)} ban ${Discord.hyperlink(`${processedModeration.player.displayName} (@${processedModeration.player.username})`, Discord.hideLinkEmbed(legacy.getUserProfileLinkFromUserId(processedModeration.player.id)))}?`, Discord.HeadingLevel.Three),
            `The first word of your ${Discord.bold(`Public Ban Reason`)} could be parsed into the duration "${formatDuration(length)}".`
         ]
            .join(`\n`),
         embeds,
         components,
         allowedMentions: {
            repliedUser: false,
            parse: []
         }
      });


      // get the player id that this moderator selects, if nothing was returned then the menu likely timed out
      const selectedAction = await this.#collectPrompt(message);

      if (!selectedAction)
         return;


      // return the selected action
      return selectedAction;
   };


   /**
    * @param {Discord.Snowflake} guildId
    */
   async getApplicationCommands(guildId) {
      const fetchCommandsFrom = guildId
         ? await this.#client.guilds.fetch(guildId)
         : this.#client.application;

      const applicationCommands = await fetchCommandsFrom.commands.fetch();
      return applicationCommands;
   };


   /**
    * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationErrorData} processedModeration
    * @param {Discord.ApplicationCommand[]} applicationCommands
    */
   #getPreModerationErrorBotEmbedDescription(processedModeration, applicationCommands) {
      const applicationCommandCommandsId = applicationCommands.find(command => command.name === `commands`)?.id || 0;

      switch (processedModeration.error) {
         case `malformed command`:
            return [
               Discord.heading(`${this.#client.allEmojis.error} Incorrect command format`, Discord.HeadingLevel.Three),
               `Use ${this.#client.allEmojis.slash_command} ${Discord.chatInputApplicationCommandMention(`commands`, applicationCommandCommandsId)} or ${this.#client.allEmojis.message} ${Discord.bold(`${prefix}help`)} for help on how to use this command.`
            ]
               .join(`\n`);

         case `invalid length`:
            return [
               Discord.heading(`${this.#client.allEmojis.error} Incorrect length format`, Discord.HeadingLevel.Three),
               `Valid lengths are the time in ${Discord.bold(`seconds`)} (${Discord.inlineCode(`86400`)} = 1 day) or as ${Discord.bold(`number/duration pairs`)} (${Discord.inlineCode(`1w2d3h4m5s`)} = 1 week, 2 days, 3 hours, 4 minutes, 5 seconds).`,
               `Lengths must also be ${Discord.bold(`between 1 second and 315,576,000,000 seconds`)}.`,
               `Still unsure? Use ${this.#client.allEmojis.slash_command} ${Discord.chatInputApplicationCommandMention(`commands`, applicationCommandCommandsId)} or ${this.#client.allEmojis.message} ${Discord.bold(`${prefix}help`)} for help on how to use this command.`
            ]
               .join(`\n`);

         case `unknown player`:
            return [
               Discord.heading(`${this.#client.allEmojis.error} Unknown player "${Discord.escapeMarkdown(processedModeration.player)}"`, Discord.HeadingLevel.Three),
               `Input a player's ${Discord.bold(`Roblox username`)} or ${Discord.bold(`Player id`)}.`,
               `If this player is correct, ${Discord.bold(`you may have inputted a player's previous username`)} or ${Discord.bold(Discord.hyperlink(`Roblox may be having an outage`, Discord.hideLinkEmbed(`https://status.roblox.com`)))} right now.`
            ]
               .join(`\n`);
      };
   };


   /**
    * @param {Discord.Snowflake} guildId
    * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationErrorData} processedModeration
    */
   async #formatPreModerationErrorBotEmbed(guildId, processedModeration) {
      const applicationCommands = await this.getApplicationCommands(guildId);

      return new Discord.EmbedBuilder()
         .setColor(colours.flooded_area_moderation)
         .setDescription(
            this.#getPreModerationErrorBotEmbedDescription(processedModeration, applicationCommands)
         );
   };


   /**
    * 🗃️ format player data and push these moderations to the `ModerationsManager.moderations` queue
    * @param {import("@flooded-area-moderation-types/client").Message} message
    * @param {import("@flooded-area-moderation-types/moderations").ModerationData[]} moderationData
    */
   async pushModerations(message, moderationData) {
      // roblox is offline
      if (!await this.#robloxIsOnline())
         return await message.edit({
            content: [
               Discord.heading(`${this.#client.allEmojis.error} Cannot connect to Roblox`, Discord.HeadingLevel.Three),
               `${Discord.bold(Discord.hyperlink(`Roblox may be having an outage`, Discord.hideLinkEmbed(`https://status.roblox.com`)))} right now: ${this.#client.user} is unable to moderate any players.`
            ]
               .join(`\n`),
            allowedMentions: {
               repliedUser: false
            }
         });


      // the moderator who ran this command
      const moderator = await this.#getModerator(message);


      // the new ProcessedModerationData: a deep-cloned version of ModerationData
      const processedModerationData = structuredClone(moderationData);


      // attempt to map each player in the moderationData to player info assuming that they're usernames: if they are not usernames then the value will not be mapped
      const playerDataByUsernames = await legacy.getUsersByUsernames(
         moderationData.map(data => data.player)
      );

      for (const processedModeration of processedModerationData) {
         const foundPlayerDataByUsername = playerDataByUsernames.find(data => data.requestedUsername === processedModeration.player);

         if (!foundPlayerDataByUsername)
            continue;

         processedModeration.player = {
            id: foundPlayerDataByUsername.id,
            displayName: foundPlayerDataByUsername.displayName,
            name: foundPlayerDataByUsername.name
         };
      };


      // resolve possible player ids
      for (const processedModeration of processedModerationData) {
         // this ProcessedModerationData already has an an error, don't do anything
         if (processedModeration.error)
            continue;


         // player data
         const playerDataIfId       = await legacy.getUserByUserId(processedModeration.player?.name ?? processedModeration.player);
         const playerDataIfUsername = typeof processedModeration.player === `object` ? processedModeration.player : undefined;


         // get player data and prompt if both the above data returns something
         const playerData = await this.resolvePlayerData(message, playerDataIfId, playerDataIfUsername);


         if (playerData) { // map player data
            processedModeration.player = {
               id: playerData.id,
               displayName: playerData.displayName,
               username: playerData.name
            };

         } else { // this isn't a player
            processedModeration.error = `unknown player`;
         };
      };


      // fetch player avatar headshots
      const avatarHeadshotsByUserIds = await legacy.getAvatarHeadshotsByUserIds(
         processedModerationData
            .filter(data => !data.error)
            .map(data => data.player.id)
      );

      for (const processedModeration of processedModerationData) {
         if (processedModeration.error)
            continue;

         const foundAvatarHeadshotsByUserId = avatarHeadshotsByUserIds.find(data => data.targetId === processedModeration.player?.id);
         processedModeration.player.avatar = foundAvatarHeadshotsByUserId?.imageUrl ?? null;
      };


      // for each permanent ban (ban without a length), was it meant to be a temporary ban? if so, convert the ban to a temporary ban
      for (const processedModeration of processedModerationData) {
         if (processedModeration.error)
            continue;

         const isBan = processedModeration.action === `ban`;
         const hasLength = processedModeration.length;

         const lengthInReason = processedModeration.displayReason?.split(/ +/)[0];
         const length = toSeconds(lengthInReason);

         const isBanButFirstWordInLengthCanBeReason = isBan && !hasLength && length;
         if (!isBanButFirstWordInLengthCanBeReason)
            continue;

         const selectedAction = await this.#promptModerationAction(message, processedModeration, length);

         if (selectedAction === `ban`)
            continue;

         processedModeration.action = selectedAction;
         processedModeration.length = length;
         processedModeration.displayReason = processedModeration.displayReason.slice(lengthInReason.length).trim() || defaultBanReason;
      };


      // update the message to show that players are being moderated
      const embeds = await Promise.all(
         processedModerationData.map(async processedModeration =>
            processedModeration.error
               ? await this.#formatPreModerationErrorBotEmbed(message.guildId, processedModeration)
               : await this.formatPreModerationBotEmbed      (message.guildId, processedModeration)
         )
      );

      await message.edit({
         content: null,
         embeds,
         allowedMentions: {
            repliedUser: false
         }
      });


      // map the ProcessedModerationData into its final form! ..and push it to the moderations queue
      for (const [ i, processedModeration ] of processedModerationData.entries())
         Object.assign(processedModeration, {
            discordModerator: {
               username: moderator.username,
               id:       moderator.id
            },
            message: {
               guildId: message.guildId,
               channelId: message.channelId,
               messageId: message.id,
               embedIndex: i
            }
         });

      this.#moderations.push(
         ...processedModerationData
            .filter(processedModeration => !processedModeration.error)
      );
   };


   /**
    * 🗃️ format player data and push this moderation to the `ModerationsManager.moderations`
    * @param {import("@flooded-area-moderation-types/client").Message} message
    * @param {import("@flooded-area-moderation-types/moderations").ModerationData} moderationData
    */
   async pushModeration(message, moderationData) {
      await this.pushModerations(message, [ moderationData ]);
   };
};


export class ModerationsHistory {
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
      return discordData
         .find(discordData => discordData.guildId === guildId)
         .logs
         .channelId;
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
         content: `${this.#interactionOrMessage.client.allEmojis.warning} ${Discord.bold(`Known issue`)}: recent moderations may not show up here ${Discord.hyperlink(`due to a Roblox issue`, Discord.hideLinkEmbed(`https://devforum.roblox.com/t/exception-was-thrown-by-handler-when-querying-datastore-entries-with-certain-characters/3268209?u=magicalbunny31`))}, this warning will be removed once it's confirmed to have been fixed.`, // TODO
         embeds,
         components,
         allowedMentions: {
            repliedUser: false
         }
      });
   };
};


export class ModerationsStatistics {
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
    * @param {import("@google-cloud/firestore").CollectionGroup} collectionGroup
    */
   async #moderationHistoryQueryRoblox(collectionGroup) {
      await this.#setBloxlinkLinkedAccountPlayerId();

      if (!this.#bloxlinkLinkedAccountPlayerId)
         return undefined;

      return collectionGroup.where(`moderator.roblox`, `==`, this.#bloxlinkLinkedAccountPlayerId);
   };


   /**
    * @param {import("@google-cloud/firestore").CollectionGroup} collectionGroup
    */
   #moderationHistoryQueryDiscord(collectionGroup) {
      const userId = this.#commandUser.id;
      return collectionGroup.where(`moderator.discord`, `==`, userId);
   };


   /**
    * @param {import("@google-cloud/firestore").Query} moderationHistoryQuery
    * @param {number} universeId
    * @returns {Promise<[ import("@flooded-area-moderation-types/moderations").Action, number ][]>}
    */
   async #mapModerationHistory(moderationHistoryQuery, universeId) {
      const moderationHistory = [];

      if (!moderationHistoryQuery)
         return moderationHistory;

      const moderationHistorySnap = await moderationHistoryQuery.get();
      for (const moderationHistoryDocSnap of moderationHistorySnap.docs) {
         const [ _universes, universe, _players, player, _moderationHistory, timestamp ] = moderationHistoryDocSnap.ref.path.split(`/`);
         const data = moderationHistoryDocSnap.data();

         if (+universe !== +universeId)
            continue;

         switch (this.#selectedMenu) {
            case `all`:
               moderationHistory.push([ data.action, +player ]);
               break;

            default:
               const moderationDate = dayjs(+timestamp);
               const inRange = dayjs().subtract(+this.#selectedMenu, `days`).isBefore(moderationDate);
               if (!inRange)
                  break;
               moderationHistory.push([ data.action, +player ]);
         };
      };

      return moderationHistory;
   };


   /**
    * @param {Discord.Snowflake} guildId
    */
   async #getModeratedPlayers(guildId) {
      const universeId = this.#interactionOrMessage.client.moderations.getUniverseId(guildId);

      const moderationHistoryColGroup     = this.#interactionOrMessage.client.firestore.collectionGroup(`moderation-history`);
      const moderationHistoryQueryRoblox  = await this.#moderationHistoryQueryRoblox (moderationHistoryColGroup);
      const moderationHistoryQueryDiscord =       this.#moderationHistoryQueryDiscord(moderationHistoryColGroup);

      return [
         await this.#mapModerationHistory(moderationHistoryQueryRoblox,  universeId),
         await this.#mapModerationHistory(moderationHistoryQueryDiscord, universeId)
      ];
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


export class ActiveModerations {
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