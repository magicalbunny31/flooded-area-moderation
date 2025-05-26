import ActiveModerations from "../../classes/active-moderations.js";
import config from "../../data/config.js";

import Discord from "discord.js";


export const guilds = config.map(config => [ config.discord.guildId, config.roblox.experience.name ]);

export const getData = experienceName => new Discord.SlashCommandBuilder()
   .setName(`active-moderations`)
   .setDescription(`See which players are currently (temporarily) banned from ${experienceName}`)
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