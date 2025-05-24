import Commands from "../../classes/commands.js";
import config from "../../data/config.js";

import Discord from "discord.js";


export const guilds = config.map(config => config.discord.guildId);

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
   const commands = new Commands(interaction, `chat-input application commands`);

   await commands.showCommands();
};