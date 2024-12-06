import ActiveModerations from "../../data/classes/active-moderations.js";
import { guilds as commandGuilds } from "../../data/experiences.js";

import Discord from "discord.js";


export const guilds = commandGuilds;

export const data = new Discord.SlashCommandBuilder()
   .setName(`active-moderations`)
   .setDescription(`See which players are currently (temporarily) banned from Flooded Area`)
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