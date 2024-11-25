import { Help } from "../../data/message-commands.js";


/**
 * @param {import("@flooded-area-moderation-types/client").Message} message
 */
export default async message => {
   // send typing to the channel
   await message.channel.sendTyping();


   // show command help
   const commands = new Help(message, `text-based commands`);

   await commands.showCommands();
};