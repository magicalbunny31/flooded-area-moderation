import ModerationsHistory from "../../classes/moderations-history.js";

import { deferComponents } from "@magicalbunny31/pawesome-utility-stuffs";


/**
 * @param {import("@flooded-area-moderation-types/client").ButtonInteraction} interaction
 */
export default async interaction => {
   // button info
   const [ _button, playerUsername, rawMenuIndex, rawHideModerator ] = interaction.customId.split(`:`);

   const menuIndex = +rawMenuIndex;
   const hideModerator = rawHideModerator === `true`;


   // defer the interaction
   if (
      interaction.message?.interactionMetadata && interaction.message?.interactionMetadata.user.id === interaction.user.id
         || interaction.message?.reference && (await interaction.message.fetchReference()).author.id === interaction.user.id
   )
      await interaction.update({
         components: deferComponents(interaction.customId, interaction.message.components),
         fetchReply: true
      });

   else
      await interaction.deferReply({
         fetchReply: true,
         ephemeral: true
      });


   // show moderation history
   const History = new ModerationsHistory(interaction, playerUsername, menuIndex, hideModerator);

   await History.showModerationHistory();
};