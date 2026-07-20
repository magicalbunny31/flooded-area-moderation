import ActiveModerations from "../../classes/active-moderations.js";


/**
 * @param {import("@flooded-area-moderation-types/client").Message} message
 */
export default async message => {
   // send typing to the channel
   await message.channel.sendTyping();


   // show active moderations
   const Moderations = new ActiveModerations(message);

   await Moderations.showActiveModerations();
};