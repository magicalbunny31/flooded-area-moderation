import { discord as discordRoblox, legacy } from "../../data/roblox.js";


/**
 * @param {import("@flooded-area-moderation-types/client").AutocompleteInteraction} interaction
 */
export default async interaction => {
   // options
   const { name, value: rawInput } = interaction.options.getFocused(true);
   const input = rawInput.trim();


   // what to do for each option
   switch (name) {


      // player
      default: {
         if (!input)
            return await interaction.respond([]);

         const userByUsername = await legacy.getUserByUsername(input);

         const userByUserId = !isNaN(+input)
            ? await legacy.getUserByUserId(input)
            : undefined;

         const choices = discordRoblox.usersToDiscordAutocompleteChoices(
            [
               userByUsername,
               userByUserId
            ]
               .filter(Boolean)
         );

         await interaction.respond(choices);

         break;
      };


   };
};