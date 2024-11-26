import { guilds as commandGuilds } from "../../data/experiences.js";
import { ModerationsStatistics } from "../../data/moderations.js";

import Discord from "discord.js";


export const guilds = commandGuilds;

export const data = new Discord.SlashCommandBuilder()
   .setName(`moderation-statistics`)
   .setDescription(`View statistics on the players you've moderated in Flooded Area`)
   .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageGuild);


/**
 * @param {import("@flooded-area-moderation-types/client").ChatInputCommandInteraction} interaction
 */
export default async interaction => {
   // defer the interaction
   await interaction.deferReply();


   // show moderation statistics
   const Statistics = new ModerationsStatistics(interaction);

   await Statistics.showModerationStatistics();
};