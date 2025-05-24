import ActiveModerations from "../../classes/active-moderations.js";

import { deferComponents } from "@magicalbunny31/pawesome-utility-stuffs";


/**
 * @param {import("@flooded-area-moderation-types/client").StringSelectMenuInteraction} interaction
 */
export default async interaction => {
   // select menu info
   const [ selectMenu, rawMenuIndex ] = interaction.customId.split(`:`);
   const [ rawSelectedPlayerIndex ] = interaction.values;

   const menuIndex = rawMenuIndex === `selected-filters`
      ? 0
      : +rawMenuIndex;

   const selectedPlayerIndex = rawMenuIndex === `selected-filters`
      ? 0
      : +rawSelectedPlayerIndex;

   const selectedFilters = rawMenuIndex === `selected-filters`
      ? interaction.values
      : interaction.message
         .resolveComponent(`${selectMenu}:selected-filters`)
         .options
         .filter(option => option.default)
         .map(option => option.value);


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


   // show active moderations
   const Moderations = new ActiveModerations(interaction, selectedPlayerIndex, selectedFilters, menuIndex);

   await Moderations.showActiveModerations();
};