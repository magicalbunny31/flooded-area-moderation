import { guilds as commandGuilds } from "../../data/experiences.js";
import { ActiveModerations } from "../../data/moderations.js";

import Discord from "discord.js";


export const guilds = commandGuilds;

export const data = new Discord.SlashCommandBuilder()
   .setName(`active-moderations`)
   .setDescription(`View current active moderations in Flooded Area`)
   .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageGuild);


/**
 * @param {import("@flooded-area-moderation-types/client").ChatInputCommandInteraction} interaction
 */
export default async interaction => {
   // defer the interaction
   await interaction.deferReply();


   // show active moderations
   const Moderations = new ActiveModerations(interaction);

   await Moderations.showActiveModerations();
};