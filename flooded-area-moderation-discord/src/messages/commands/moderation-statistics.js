import ModerationsStatistics from "../../classes/moderations-statistics.js";


/**
 * @param {import("@flooded-area-moderation-types/client").Message} message
 */
export default async message => {
   // send typing to the channel
   await message.channel.sendTyping();


   // show moderation statistics
   const Statistics = new ModerationsStatistics(message);

   await Statistics.showModerationStatistics();
};