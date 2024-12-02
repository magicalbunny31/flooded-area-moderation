import { guilds as commandGuilds } from "../../data/experiences.js";
import { ModerationsStatistics } from "../../data/moderations.js";

import Discord from "discord.js";


export const guilds = commandGuilds;

export const data = new Discord.SlashCommandBuilder()
   .setName(`say`)
   .setDescription(`Make the app's bot user send a message in the channel`)
   .addStringOption(
      new Discord.SlashCommandStringOption()
         .setName(`content`)
         .setDescription(`Message's content to send to the channel`)
   )
   .addAttachmentOption(
      new Discord.SlashCommandAttachmentOption()
         .setName(`attachment`)
         .setDescription(`Message's attachment to send to the channel`)
   )
   .addChannelOption(
      new Discord.SlashCommandChannelOption()
         .setName(`channel`)
         .setDescription(`Channel to send this message to`)
         .addChannelTypes(
            Discord.ChannelType.AnnouncementThread, Discord.ChannelType.GuildAnnouncement,
            Discord.ChannelType.GuildStageVoice,    Discord.ChannelType.GuildText,
            Discord.ChannelType.GuildVoice,         Discord.ChannelType.PrivateThread,
            Discord.ChannelType.PublicThread
         )
   )
   .addStringOption(
      new Discord.SlashCommandStringOption()
         .setName(`reply-to`)
         .setDescription(`Another message's id in the channel to reply to, @mention off`)
         .setMinLength(17)
         .setMaxLength(19)
   )
   .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator);


/**
 * @param {import("@flooded-area-moderation-types/client").ChatInputCommandInteraction} interaction
 */
export default async interaction => {
   // options
   const content    = interaction.options.getString(`content`);
   const attachment = interaction.options.getAttachment(`attachment`);
   const channel    = interaction.options.getChannel(`channel`) ?? interaction.channel;
   const replyTo    = interaction.options.getString(`reply-to`);


   // empty message
   if (!content && !attachment)
      return await interaction.reply({
         content: Discord.heading(`${interaction.client.allEmojis.error} At least one of \`content\` or \`attachment\` options are required`, Discord.HeadingLevel.Three),
         ephemeral: true
      });


   // attachment exceeds upload limit
   const fileUploadLimit = (() => {
      switch (interaction.guild.premiumTier) {
         default:                             return 2.5e+7;
         case Discord.GuildPremiumTier.Tier2: return 5e+7;
         case Discord.GuildPremiumTier.Tier3: return 1e+8;
      };
   })();

   if (attachment?.size > fileUploadLimit)
      return await interaction.reply({
         content: [
            Discord.heading(`${interaction.client.allEmojis.error} Invalid option`, Discord.HeadingLevel.Three),
            Discord.unorderedList([
               `${Discord.inlineCode(`attachment`)} option's file size exceeds this server's file upload limit.`
            ])
         ],
         ephemeral: true
      });


   // reply to the interaction
   await interaction.deferReply({
      ephemeral: true
   });


   // send typing to the channel
   await channel.sendTyping();


   // send the message to this channel
   await channel.send({
      content,
      files: attachment
         ? [ attachment ]
         : [],
      ...replyTo
         ? {
            reply: {
               messageReference: replyTo,
               failIfNotExists: false
            }
         }
         : {},
      allowedMentions: {
         parse: []
      }
   });


   // delete the interaction's reply
   await interaction.deleteReply();
};