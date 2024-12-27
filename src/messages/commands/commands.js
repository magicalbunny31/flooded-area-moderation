import Commands from "../../classes/commands.js";


/**
 * @param {import("@flooded-area-moderation-types/client").Message} message
 */
export default async message => {
   // send typing to the channel
   await message.channel.sendTyping();


   // show command help
   const commands = new Commands(message, `text-based commands`);

   await commands.showCommands();
};