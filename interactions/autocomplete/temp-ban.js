import formatDuration, { toSeconds, defaultOptions } from "../../data/format-duration.js";
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


      // duration
      case `duration`: {
         // turn the input into a length in seconds
         const seconds = toSeconds(input);


         /**
          * show default options if:
          * - invalid length
          * - input is less than 1 second
          * - input exceeds the max safe integer
          */
         if (!seconds || seconds < 1 || seconds > Number.MAX_SAFE_INTEGER)
            return await interaction.respond(defaultOptions);


         // format the duration to a human-readable string
         const formattedDuration = formatDuration(seconds);


         // send autocomplete results
         await interaction.respond(
            [{
               name: formattedDuration,
               value: seconds
            }]
         );


         // break out
         break;
      };


   };
};