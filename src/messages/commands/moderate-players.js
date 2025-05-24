import config from "../../data/config.js";
import { content, modal, defaultBanReason } from "../../data/defaults.js";
import { toSeconds } from "../../data/format-duration.js";
import { commands, prefix } from "../../data/message-commands.js";

import Discord from "discord.js";
import { set } from "@magicalbunny31/pawesome-utility-stuffs";


/**
 * @param {import("@flooded-area-moderation-types/client").Message} message
 */
export default async message => {
   // this IS a potential command
   const prefixRegexp = new RegExp(`^(<@!?${message.client.user.id}>|${prefix})\\s*`);
   const commandContents = message.content.split(/\r?\n+/g);


   // map each commandContents to its moderationData
   const moderationData = [];

   for (const commandContent of commandContents) {
      // this isn't a command
      const lowerCaseCommandContent = commandContent.toLowerCase();

      if (!prefixRegexp.test(lowerCaseCommandContent))
         continue;


      // command information
      const [ _, matchedPrefix ] = lowerCaseCommandContent.match(prefixRegexp);
      const [ commandName, ...args ] = lowerCaseCommandContent.slice(matchedPrefix.length).trim().split(/\s+/);


      // default options
      const banAltAccounts = true;


      // what command this is
      const command = commands.find(command => command.acceptedNames.includes(commandName));

      if (!command)
         continue;


      // command.action to moderation action
      const action = (() => {
         switch (command.action) {
            case `ban`:
            case `mass-ban`:
               return `ban`;
            case `temp-ban`:
            case `mass-temp-ban`:
               return `temp-ban`;
            case `unban`:
            case `mass-unban`:
               return `revoke-ban`;
         };
      })();


      if (command.action.includes(`mass`)) { // moderate multiple players
         // command arguments
         const [ rawPlayers, args ] = commandContent.slice(commandContent.indexOf(commandName) + commandName.length).split(`,`);

         const players = set(
            rawPlayers.trim().split(/\s+/)
         );

         const [ rawLength ] = args?.trim().split(/\s+/) || [];
         const length = action === `temp-ban`
            ? toSeconds(rawLength)
            : undefined;

         const displayReason = action === `revoke-ban`
            ? undefined
            : commandContent.includes(`,`)
               ? commandContent
                  .slice(
                     length
                        ? (commandContent.search(/, *[0-9]*/) !== -1 ? commandContent.search(/, *[0-9]*/) : commandContent.search(/, *[0-9]*/)) + (rawLength?.length || 0) + 2
                        : commandContent.indexOf(`,`) + `,`.length
                  )
                  .trim()
               : defaultBanReason;

         const privateReason = action === `revoke-ban`
            ? undefined
            : [
               displayReason,
               modal.modalPrivateReasonAttribution(message.author)
            ]
               .join(``);


         // no players
         if (!rawPlayers) {
            moderationData.push({
               action,
               error: `malformed command`
            });

            continue;
         };


         // length is not valid or not within limits
         const minimumLength = 1;
         const maximumLength = 315_576_000_000;
         if (length !== undefined && !(length > minimumLength && length < maximumLength)) {
            moderationData.push({
               action,
               error: `invalid length`
            });

            continue;
         };


         // push this command data
         for (const player of players)
            moderationData.push({
               action,
               player,
               length,
               excludeAltAccounts: !banAltAccounts,
               displayReason,
               privateReason
            });


      } else { // moderate a single player
         // command arguments
         const [ player, rawLength ] = args;

         const length = action === `temp-ban`
            ? toSeconds(rawLength)
            : undefined;

         const displayReason = action === `revoke-ban`
            ? undefined
            : commandContent
               .slice(
                  length
                     ? (commandContent.indexOf(` ${rawLength} `) !== -1 ? commandContent.indexOf(` ${rawLength} `) : commandContent.lastIndexOf(` ${rawLength}`)) + (rawLength?.length || 0) + 2
                     : lowerCaseCommandContent.indexOf(player) + player?.length
               )
               .trim()
               || defaultBanReason;

         const privateReason = action === `revoke-ban`
            ? undefined
            : [
               displayReason,
               modal.modalPrivateReasonAttribution(message.author)
            ]
               .join(``);


         // no player
         if (!player) {
            moderationData.push({
               action,
               error: `malformed command`
            });

            continue;
         };


         // length is not valid or not within limits
         const minimumLength = 1;
         const maximumLength = 315_576_000_000;
         if (length !== undefined && !(length > minimumLength && length < maximumLength)) {
            moderationData.push({
               action,
               error: `invalid length`
            });

            continue;
         };


         // push this command data
         moderationData.push({
            action,
            player,
            length,
            excludeAltAccounts: !banAltAccounts,
            displayReason,
            privateReason
         });
      };
   };


   // these weren't commands
   if (!moderationData.length)
      return;


   // person doesn't have required roles
   const moderatorRoles = config
      .find(config => config.discord.guildId === message.guildId)
      .discord.roles.moderatorIds;

   if (!message.member.roles.cache.some(role => moderatorRoles.includes(role.id)))
      return await message.reply({
         content: Discord.heading(`${message.client.allEmojis.error} ${content.noPermission}`, Discord.HeadingLevel.Three),
         allowedMentions: {
            repliedUser: false
         }
      });


   // "defer" the command's reply
   const messageResponse = await message.reply({
      content: Discord.heading(`${message.client.allEmojis.loading} ${content.fetchingPlayerData}`, Discord.HeadingLevel.Three),
      allowedMentions: {
         repliedUser: false
      }
   });


   // too many players
   if (moderationData.length > 10)
      return await messageResponse.edit({
         content: [
            Discord.heading(`${message.client.allEmojis.error} Only up to 10 players can be moderated at once`, Discord.HeadingLevel.Three),
            `Split the players to moderate into separate commands.`
         ]
            .join(`\n`),
         allowedMentions: {
            repliedUser: false
         }
      });


   // push these moderations
   await message.client.moderations.pushModerations(messageResponse, moderationData);
};