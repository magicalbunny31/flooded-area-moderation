import config from "../data/config.js";
import { content } from "../data/defaults.js";
import { commands, prefix } from "../data/message-commands.js";

import path from "node:path";
import Discord from "discord.js";
import chalk from "chalk";
import { colours, tryOrUndefined } from "@magicalbunny31/pawesome-utility-stuffs";


export const name = Discord.Events.MessageCreate;


/**
 * @param {import("@flooded-area-moderation-types/client").Message} message
 */
export default async message => {
   // function to catch errors
   const catchError = async (error, commandName) => {
      // log this caught error
      const cwd = process.cwd();
      const file = import.meta.filename;
      const location = path.relative(cwd, file);

      console.error(chalk.hex(colours.flooded_area_moderation)(`~ caught error in ${location}! see below for the error..`));
      console.line(error.stack ?? error ?? `no error..?`);

      try {
         const source = `${Discord.inlineCode(`message`)}/${Discord.inlineCode(commandName)}`;
         await message.client.fennec.postErrorLog(error, source, message.createdAt, message.id);
      } catch (error) {
         console.error(chalk.hex(colours.flooded_area_moderation)(`~ ..the error handler failed to log this caught error in ${location}! see below for its error..`));
         console.line(error.stack ?? error ?? `no error..?`);
      };
   };


   // this isn't a potential command
   const prefixRegexp = new RegExp(`^(<@!?${message.client.user.id}>|${prefix})\\s*`);
   const commandContent = message.content.toLowerCase();

   if (!prefixRegexp.test(commandContent))
      return;


   // this command has multiple lines and could possibly be chaining/bulk commands: only applies to moderation commands
   const commandContents = message.content.split(/[\r\n]+/g);

   if (commandContents.length > 1) {
      // get this message command's file
      const commandName = `moderate-players`;
      const file = await import(`../messages/commands/${commandName}.js`);

      try {
         // run this command
         await file.default(message);

      } catch (error) {
         // log this caught error
         await catchError(error, commandName);
      };

      // stop here
      return;
   };


   // get this message command's file
   const [ _, matchedPrefix ] = commandContent.match(prefixRegexp);
   const [ commandName, ...args ] = message.content.slice(matchedPrefix.length).trim().split(/\s+/);

   const command = commands.find(command => command.acceptedNames.includes(commandName));

   if (!command)
      return;

   const file = await tryOrUndefined(import(`../messages/commands/${command.commandName}.js`));

   if (!file)
      return;


   // person doesn't have required roles
   const moderatorRoles = config
      .find(config => config.discord.guildId === message.guildId)
      .discord.roles.moderatorIds;

   if (!message.member.roles.cache.some(role => moderatorRoles.includes(role.id)))
      return await message.reply({
         components: [
            new Discord.TextDisplayBuilder()
               .setContent(
                  Discord.heading(`${message.client.allEmojis.error} ${content.noPermission}`, Discord.HeadingLevel.Three)
               )
         ],
         flags: [
            Discord.MessageFlags.IsComponentsV2
         ],
         allowedMentions: {
            repliedUser: false
         }
      });


   try {
      // run this command
      await file.default(message, ...args);


   } catch (error) {
      // log this caught error
      await catchError(error, command.commandName);
   };
};