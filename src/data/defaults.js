import Discord from "discord.js";


export const content = {


   fetchingPlayerData: `Fetching player data...`,


   timedOut: `Command timed out`,


   noPermission: `You do not have permission to use this command`,


   noLinkedAccount: userId => `Couldn't fetch linked account for ${Discord.userMention(userId)}`


};


const modalPrivateReasonAttribution = user => `\n\nModerated by @${user.username} (${user.id}) via "flooded area moderation" Discord app`;

const banBaseModal = (commandDataId, user, plural) => new Discord.ModalBuilder()
   .setCustomId(`moderate-players:${commandDataId}`)
   .setTitle(`Ban ${plural ? `Players` : `Player`}`)
   .setComponents(
      new Discord.ActionRowBuilder()
         .setComponents(
            new Discord.TextInputBuilder()
               .setCustomId(`display-reason`)
               .setLabel(`PUBLIC BAN REASON`)
               .setMaxLength(400)
               .setPlaceholder(`Reason for this ban, shown to the banned ${plural ? `players` : `player`}. Must abide by Roblox Community Standards.`)
               .setRequired(false)
               .setStyle(Discord.TextInputStyle.Paragraph)
         ),
      new Discord.ActionRowBuilder()
         .setComponents(
            new Discord.TextInputBuilder()
               .setCustomId(`private-reason`)
               .setLabel(`PRIVATE BAN REASON`)
               .setMaxLength(1000 - modalPrivateReasonAttribution(user).length)
               .setPlaceholder(`Extended reason for this ban, not shown to the banned ${plural ? `players` : `player`}.`)
               .setRequired(false)
               .setStyle(Discord.TextInputStyle.Paragraph)
         )
   );

const tempBanBaseModal = (commandDataId, user, plural) => banBaseModal(commandDataId, user, plural)
   .setTitle(`Temporarily Ban ${plural ? `Players` : `Player`}`);

export const modal = {


   modalPrivateReasonAttribution,


   banModal: (commandDataId, user) => banBaseModal(commandDataId, user, false),


   massBanModal: (commandDataId, user) => banBaseModal(commandDataId, user, true),


   tempBanModal: (commandDataId, user) => tempBanBaseModal(commandDataId, user, false),


   massTempBanModal: (commandDataId, user) => tempBanBaseModal(commandDataId, user, true)


};


export const defaultBanReason = `No reason given by moderator`;