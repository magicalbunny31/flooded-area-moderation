import { guilds as commandGuilds } from "../../data/experiences.js";
import { Help } from "../../data/message-commands.js";

import Discord from "discord.js";


export const guilds = commandGuilds;

export const data = new Discord.SlashCommandBuilder()
   .setName(`commands`)
   .setDescription(`Get helpful information on how to use this app's commands`)
   .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageGuild);


/**
 * @param {import("@flooded-area-moderation-types/client").ChatInputCommandInteraction} interaction
 */
export default async interaction => {
   // defer the interaction
   await interaction.deferReply();



   // show command help
   const commands = new Help(interaction, `chat-input application commands`);

   await commands.showCommands();
};