import ModerationsHistory from "../../classes/moderations-history.js";

import { deferComponents } from "@magicalbunny31/pawesome-utility-stuffs";


/**
 * @param {import("@flooded-area-moderation-types/client").StringSelectMenuInteraction} interaction
 */
export default async interaction => {
   // select menu info
   const [ _selectMenu, playerUsername, rawMenuIndex, rawHideModerator ] = interaction.customId.split(`:`);
   const [ rawSelectedId ] = interaction.values;

   const menuIndex = +rawMenuIndex;
   const hideModerator = rawHideModerator === `true`;
   const selectedId = +rawSelectedId;


   // defer the interaction
   if (
      interaction.message?.interactionMetadata && interaction.message?.interactionMetadata.user.id === interaction.user.id
         || interaction.message?.reference && (await interaction.message.fetchReference()).author.id === interaction.user.id
   )
      await interaction.update({
         components: deferComponents(interaction.customId, interaction.message.components, interaction.values)
      });

   else
      await interaction.deferReply({
         ephemeral: true
      });


   // show moderation history
   const History = new ModerationsHistory(interaction, playerUsername, menuIndex, hideModerator, selectedId);

   await History.showModerationHistory();
};