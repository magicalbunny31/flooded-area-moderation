import ActiveModerations from "../../data/classes/active-moderations.js";

import { deferComponents } from "@magicalbunny31/pawesome-utility-stuffs";


/**
 * @param {import("@flooded-area-moderation-types/client").ButtonInteraction} interaction
 */
export default async interaction => {
   // button info
   const [ button, rawMenuIndex ] = interaction.customId.split(`:`);

   const menuIndex = +rawMenuIndex;

   const selectedPlayerIndex = 0;

   const selectedFilters = interaction.message
      .resolveComponent(`${button}:selected-filters`)
      .options
      .filter(option => option.default)
      .map(option => option.value);


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


   // show active moderations
   const Moderations = new ActiveModerations(interaction, selectedPlayerIndex, selectedFilters, menuIndex);

   await Moderations.showActiveModerations();
};