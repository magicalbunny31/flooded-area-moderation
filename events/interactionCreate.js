import discordData from "../data/discord.js";

import path from "node:path";
import Discord from "discord.js";
import chalk from "chalk";
import { colours } from "@magicalbunny31/pawesome-utility-stuffs";


export const name = Discord.Events.InteractionCreate;


/**
 * @param {import("@flooded-area-moderation-types/client").Interaction} interaction
 */
export default async interaction => {
   // person doesn't have required roles
   const moderatorRoles = discordData
      .find(discordData => discordData.guildId === interaction.guildId)
      .roles
      .moderatorIds;

   const type = (() => {
      switch (true) {
         case interaction.isAutocomplete():     return `autocomplete`;
         case interaction.isButton():           return `button`;
         case interaction.isChatInputCommand(): return `chat-input`;
         case interaction.isModalSubmit():      return `modal-submit`;
         case interaction.isAnySelectMenu():    return `select-menu`;
      };
   })();

   const canRespond = ![ `autocomplete` ].some(interactionType => interactionType === type);

   if (!interaction.member.roles.cache.some(role => moderatorRoles.includes(role.id)))
      if (canRespond)
         return await interaction.reply({
            content: Discord.heading(`${interaction.client.allEmojis.error} You do not have permission to use this command`, Discord.HeadingLevel.Three),
            ephemeral: true
         });
      else
         return;


   // get this interaction's file
   const name = (() => {
      switch (type) {
         case `autocomplete`:
         case `chat-input`:
            return interaction.commandName;
         case `button`:
         case `modal-submit`:
         case `select-menu`:
            return interaction.customId.split(`:`)[0];
      };
   })();

   const file = interaction.client.interactions[type]?.get(name);

   if (!file)
      return;


   try {
      // run this interaction
      await file.default(interaction);


   } catch (error) {
      // log this caught error
      const cwd = process.cwd();
      const file = import.meta.filename;
      const location = path.relative(cwd, file);

      console.error(chalk.hex(colours.flooded_area_moderation)(`~ caught error in ${location}! see below for the error..`));
      console.line(error.stack ?? error ?? `no error..?`);

      try {
         const source = `${Discord.inlineCode(type)}/${Discord.inlineCode(name)}`;
         await interaction.client.fennec.postErrorLog(error, source, interaction.createdAt, interaction.id);
      } catch (error) {
         console.error(chalk.hex(colours.flooded_area_moderation)(`~ ..the error handler failed to log this caught error in ${location}! see below for its error..`));
         console.line(error.stack ?? error ?? `no error..?`);
      };
   };
};