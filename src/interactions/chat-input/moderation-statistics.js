import ModerationsStatistics from "../../classes/moderations-statistics.js";
import config from "../../data/config.js";

import Discord from "discord.js";


export const guilds = config.map(config => config.discord.guildId);

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