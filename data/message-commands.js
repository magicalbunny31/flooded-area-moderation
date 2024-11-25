import Discord, { inlineCode } from "discord.js";
import { colours, choice, wait } from "@magicalbunny31/pawesome-utility-stuffs";


export const prefix = `;`;


const generateAcceptedNames = (...words) => {
   if (words.length === 2)
      return words[0].flatMap(wordA =>
         words[1].flatMap(wordB => {
            return [ `${wordA}-${wordB}`, `${wordA}_${wordB}`, `${wordA}${wordB}` ];
         })
      );

   else if (words.length === 3)
      return words[0].flatMap(wordA =>
         words[1].flatMap(wordB =>
            words[2].flatMap(wordC => {
               return [ `${wordA}-${wordB}-${wordC}`, `${wordA}_${wordB}_${wordC}`, `${wordA}${wordB}${wordC}` ];
            })
         )
      );
};


export const commands = [{
   commandName:   `moderate-players`,
   action:        `ban`,
   acceptedNames: [ `ban`, `b`, ...generateAcceptedNames([ `permanent`, `perm`, `p` ], [ `ban`, `b` ]), `kill`, `murder`, `smite`, `get` ]
}, {
   commandName:   `moderate-players`,
   action:        `mass-ban`,
   acceptedNames: [ ...generateAcceptedNames([ `mass`, `m` ], [ `ban`, `b` ]), ...generateAcceptedNames([ `mass`, `m` ], [ `permanent`, `perm`, `p` ], [ `ban`, `b` ]) ]
}, {
   commandName:   `moderate-players`,
   action:        `temp-ban`,
   acceptedNames: [ ...generateAcceptedNames([ `temporary`, `temp`, `t` ], [ `ban`, `b` ]), `exile` ]
}, {
   commandName:   `moderate-players`,
   action:        `mass-temp-ban`,
   acceptedNames: [ ...generateAcceptedNames([ `mass`, `m` ], [ `temporary`, `temp`, `t` ], [ `ban`, `b` ]) ]
}, {
   commandName:   `moderate-players`,
   action:        `unban`,
   acceptedNames: [ ...generateAcceptedNames([ `un`, `u` ], [ `ban`, `b` ]), ...generateAcceptedNames([ `revoke`, `re`, `r` ], [ `ban`, `b` ]), `pardon`, `revive`, `kiss` ]
}, {
   commandName:   `moderate-players`,
   action:        `mass-unban`,
   acceptedNames: [ ...generateAcceptedNames([ `mass`, `m` ], [ `un`, `u` ], [ `ban`, `b` ]), ...generateAcceptedNames([ `mass`, `m` ], [ `revoke`, `re`, `r` ], [ `ban`, `b` ]) ]
}, {
   commandName:   `commands`,
   acceptedNames: [ `commands`, `command`, `help` ]
}, {
   commandName:   `moderation-history`,
   acceptedNames: [ ...generateAcceptedNames([ `moderations`, `moderation`, `mod`, `m` ], [ `history`, `hist`, `h` ]), `history`, `hist`, `h` ]
}, {
   commandName:   `moderation-statistics`,
   acceptedNames: [ ...generateAcceptedNames([ `moderations`, `moderation`, `mod`, `m` ], [ `statistics`, `statistic`, `stats`, `stat`, `s` ]), `statistics`, `statistic`, `stats`, `stat`, `s` ]
}, {
   commandName:   `active-moderations`,
   acceptedNames: [ ...generateAcceptedNames([ `active`, `act`, `a` ], [ `moderations`, `moderations`, `mods`, `mod`, `m` ]), `active`, `act`, `a` ]
}];


export class Help {
   /**
    * 📦 utilities for the commands command so i don't keep repeating my code (i hate that)
    */
   constructor(interactionOrMessage, selectedMenu) {
      this.#interactionOrMessage = interactionOrMessage;
      this.#selectedMenu = selectedMenu;
   };


   /**
    * @type {import("@flooded-area-moderation-types/client").ChatInputCommandInteraction | import("@flooded-area-moderation-types/client").StringSelectMenuInteraction | import("@flooded-area-moderation-types/client").Message}
    */
   #interactionOrMessage;


   /**
    * @type {string}
    */
   #selectedMenu;


   async #getApplicationCommands() {
      const fetchedApplicationCommands = await this.#interactionOrMessage.guild.commands.fetch();
      return fetchedApplicationCommands.reduce((acc, applicationCommand) => {
         acc[applicationCommand.name] = applicationCommand.id;
         return acc;
      }, {});
   };


   /**
    * @returns {Promise<Discord.GuildMember[]>}
    */
   async #getMembers() {
      const fetchedMembers = [];
      let lastMember;

      while (true) {
         const members = (await this.#interactionOrMessage.guild.members.list({ limit: 1000, ...fetchedMembers.length ? { after: fetchedMembers.at(-1).id } : {} }));

         fetchedMembers.push(...members.values());

         if (lastMember?.id === fetchedMembers.at(-1).id)
            break;

         else
            lastMember = fetchedMembers.at(-1);

         await wait(1000);
      };

      return fetchedMembers;
   };


   /**
    * @param {string} prefix
    * @param {Discord.GuildMember[]} members
    * @param {boolean} [moderationCommandsOnly=false]
    */
   #formatCommand(prefix, members, moderationCommandsOnly = false) {
      const command = (() => {
         const command = choice(
            moderationCommandsOnly
               ? commands.filter(command => command.commandName === `moderate-players`)
               : commands
         );
         return command.action ?? command.commandName;
      })();

      const duration = choice([ `86400`, `3d`, `12h` ]);

      const reason = choice([ `being stupid`, `hacking`, `harassing me`, `i don't like them`, `silly`, `` ]);

      const getPlayers = (amount = 1) => [ choice(members, amount) ]
         .flat()
         .map(member => Discord.inlineCode(member.user.username.replace(` `, `_`)))
         .join(` `);

      switch (command) {
         default:                   return `${Discord.bold(`${prefix}${command}`)}`;
         case `ban`:                return `${Discord.bold(`${prefix}${command}`)} ${getPlayers()} ${reason ? Discord.inlineCode(reason) : ``}`;
         case `mass-ban`:           return [ `${Discord.bold(`${prefix}${command}`)} ${getPlayers(2)}`, reason ? Discord.inlineCode(reason) : `` ].join(`, `);
         case `temp-ban`:           return `${Discord.bold(`${prefix}${command}`)} ${getPlayers()} ${Discord.inlineCode(duration)} ${reason ? Discord.inlineCode(reason) : ``}`;
         case `mass-temp-ban`:      return `${Discord.bold(`${prefix}${command}`)} ${getPlayers(2)}, ${Discord.inlineCode(duration)} ${reason ? Discord.inlineCode(reason) : ``}`;
         case `unban`:              return `${Discord.bold(`${prefix}${command}`)} ${getPlayers()}`;
         case `mass-unban`:         return `${Discord.bold(`${prefix}${command}`)} ${getPlayers(2)}`;
         case `moderation-history`: return `${Discord.bold(`${prefix}${command}`)} ${getPlayers()}`;
      };
   };


   async #getEmbeds() {
      const applicationCommands = await this.#getApplicationCommands();

      switch (this.#selectedMenu) {
         case `chat-input application commands`:
            return [
               new Discord.EmbedBuilder()
                  .setColor(colours.flooded_area_moderation)
                  .setDescription(
                     [
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.slash_command} ${Discord.chatInputApplicationCommandMention(`commands`, applicationCommands[`commands`])}`, Discord.HeadingLevel.Three),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.slash_command} ${Discord.chatInputApplicationCommandMention(`ban`, applicationCommands[`ban`])} ${Discord.underline(Discord.inlineCode(`player`))} (${Discord.inlineCode(`ban-alt-accounts`)}) (${Discord.inlineCode(`public-ban-reason`)})`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`player`)))}: Roblox username or player id to ban`,
                           `${Discord.bold(Discord.inlineCode(`ban-alt-accounts`))}: Whether to also ban Roblox accounts suspected to belong to the player, controlled by Roblox (default: ${Discord.inlineCode(`true`)})`,
                           `${Discord.bold(Discord.inlineCode(`public-ban-reason`))}: If specified, skip the reason modal and display this reason to the banned player, must follow ${Discord.hyperlink(`Roblox Community Standards`, `https://help.roblox.com/hc/articles/203313410-Roblox-Community-Standards`)}`
                        ]),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.slash_command} ${Discord.chatInputApplicationCommandMention(`mass-ban`, applicationCommands[`mass-ban`])} ${Discord.underline(Discord.inlineCode(`player`))} ${Discord.underline(Discord.inlineCode(`player-2`))} (${Discord.inlineCode(`ban-alt-accounts`)}) (${Discord.inlineCode(`public-ban-reason`)}) (${Discord.inlineCode(`player-3`)} ...)`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`player`)))}: Roblox username or player id to ban`,
                           `${Discord.bold(Discord.inlineCode(`ban-alt-accounts`))}: Whether to also ban Roblox accounts suspected to belong to the player, controlled by Roblox (default: ${Discord.inlineCode(`true`)})`,
                           `${Discord.bold(Discord.inlineCode(`public-ban-reason`))}: If specified, skip the reason modal and display this reason to the banned player, must follow ${Discord.hyperlink(`Roblox Community Standards`, `https://help.roblox.com/hc/articles/203313410-Roblox-Community-Standards`)}`
                        ]),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.slash_command} ${Discord.chatInputApplicationCommandMention(`temp-ban`, applicationCommands[`temp-ban`])} ${Discord.underline(Discord.inlineCode(`player`))} ${Discord.underline(Discord.inlineCode(`duration`))} (${Discord.inlineCode(`ban-alt-accounts`)}) (${Discord.inlineCode(`public-ban-reason`)})`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`player`)))}: Roblox username or player id to temporarily ban`,
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`duration`)))}: How long to ban this player for, valid durations are the time in seconds (${Discord.inlineCode(`86400`)} = 1 day) or as number/duration pairs (${Discord.inlineCode(`1w2d3h4m5s`)} = 1 week, 2 days, 3 hours, 4 minutes, 5 seconds)`,
                           `${Discord.bold(Discord.inlineCode(`ban-alt-accounts`))}: Whether to also ban Roblox accounts suspected to belong to the player, controlled by Roblox (default: ${Discord.inlineCode(`true`)})`,
                           `${Discord.bold(Discord.inlineCode(`public-ban-reason`))}: If specified, skip the reason modal and display this reason to the temporarily banned player, must follow ${Discord.hyperlink(`Roblox Community Standards`, `https://help.roblox.com/hc/articles/203313410-Roblox-Community-Standards`)}`
                        ]),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.slash_command} ${Discord.chatInputApplicationCommandMention(`mass-temp-ban`, applicationCommands[`mass-temp-ban`])} ${Discord.underline(Discord.inlineCode(`player`))} ${Discord.underline(Discord.inlineCode(`player-2`))} ${Discord.underline(Discord.inlineCode(`duration`))} (${Discord.inlineCode(`ban-alt-accounts`)}) (${Discord.inlineCode(`public-ban-reason`)}) (${Discord.inlineCode(`player-3`)} ...)`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`player`)))}: Roblox username or player id to temporarily ban`,
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`duration`)))}: How long to ban this player for, valid durations are the time in seconds (${Discord.inlineCode(`86400`)} = 1 day) or as number/duration pairs (${Discord.inlineCode(`1w2d3h4m5s`)} = 1 week, 2 days, 3 hours, 4 minutes, 5 seconds)`,
                           `${Discord.bold(Discord.inlineCode(`ban-alt-accounts`))}: Whether to also ban Roblox accounts suspected to belong to the player, controlled by Roblox (default: ${Discord.inlineCode(`true`)})`,
                           `${Discord.bold(Discord.inlineCode(`public-ban-reason`))}: If specified, skip the reason modal and display this reason to the temporarily banned player, must follow ${Discord.hyperlink(`Roblox Community Standards`, `https://help.roblox.com/hc/articles/203313410-Roblox-Community-Standards`)}`
                        ]),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.slash_command} ${Discord.chatInputApplicationCommandMention(`unban`, applicationCommands[`unban`])} ${Discord.underline(Discord.inlineCode(`player`))}`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`player`)))}: Roblox username or player id's ban to revoke`
                        ]),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.slash_command} ${Discord.chatInputApplicationCommandMention(`mass-unban`, applicationCommands[`mass-unban`])} ${Discord.underline(Discord.inlineCode(`player`))} ${Discord.underline(Discord.inlineCode(`player-2`))} (${Discord.inlineCode(`player-3`)} ...)`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`player`)))}: Roblox username or player id's ban to revoke`
                        ]),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.slash_command} ${Discord.chatInputApplicationCommandMention(`moderation-history`, applicationCommands[`moderation-history`])} ${Discord.underline(Discord.inlineCode(`player`))}`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`player`)))}: Roblox username or player id to fetch moderation history for`
                        ]),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.slash_command} ${Discord.chatInputApplicationCommandMention(`moderation-statistics`, applicationCommands[`moderation-statistics`])}`, Discord.HeadingLevel.Three),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.slash_command} ${Discord.chatInputApplicationCommandMention(`active-moderations`, applicationCommands[`active-moderations`])}`, Discord.HeadingLevel.Three)
                     ]
                        .join(`\n`)
                  )
            ];


         case `text-based commands`:
            return [
               new Discord.EmbedBuilder()
                  .setColor(colours.flooded_area_moderation)
                  .setDescription(
                     [
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.message} ${prefix}commands`, Discord.HeadingLevel.Three),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.message} ${prefix}ban ${Discord.underline(Discord.inlineCode(`player`))} (${Discord.inlineCode(`public-ban-reason`)})`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`player`)))}: Roblox username or player id to ban`,
                           `${Discord.bold(Discord.inlineCode(`public-ban-reason`))}: Display this reason to the banned player, must follow ${Discord.hyperlink(`Roblox Community Standards`, `https://help.roblox.com/hc/articles/203313410-Roblox-Community-Standards`)}`
                        ]),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.message} ${prefix}mass-ban ${Discord.underline(Discord.inlineCode(`player`))} ${Discord.underline(Discord.inlineCode(`player-2`))} ..., (${Discord.inlineCode(`public-ban-reason`)})`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`player`)))}: Roblox username or player id to ban, add up to 10 players then add a "," to start the next arguments`,
                           `${Discord.bold(Discord.inlineCode(`public-ban-reason`))}: Display this reason to the banned player, must follow ${Discord.hyperlink(`Roblox Community Standards`, `https://help.roblox.com/hc/articles/203313410-Roblox-Community-Standards`)}`
                        ]),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.message} ${prefix}temp-ban ${Discord.underline(Discord.inlineCode(`player`))} ${Discord.underline(Discord.inlineCode(`duration`))} (${Discord.inlineCode(`public-ban-reason`)})`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`player`)))}: Roblox username or player id to temporarily ban`,
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`duration`)))}: How long to ban this player for, valid durations are the time in seconds (${Discord.inlineCode(`86400`)} = 1 day) or as number/duration pairs (${Discord.inlineCode(`1w2d3h4m5s`)} = 1 week, 2 days, 3 hours, 4 minutes, 5 seconds)`,
                           `${Discord.bold(Discord.inlineCode(`public-ban-reason`))}: If specified, skip the reason modal and display this reason to the temporarily banned player: this must follow ${Discord.hyperlink(`Roblox Community Standards`, `https://help.roblox.com/hc/articles/203313410-Roblox-Community-Standards`)}`
                        ]),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.message} ${prefix}mass-temp-ban ${Discord.underline(Discord.inlineCode(`player`))} ${Discord.underline(Discord.inlineCode(`player-2`))} ..., ${Discord.underline(Discord.inlineCode(`duration`))} (${Discord.inlineCode(`public-ban-reason`)})`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`player`)))}: Roblox username or player id to temporarily ban`,
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`duration`)))}: How long to ban this player for, valid durations are the time in seconds (${Discord.inlineCode(`86400`)} = 1 day) or as number/duration pairs (${Discord.inlineCode(`1w2d3h4m5s`)} = 1 week, 2 days, 3 hours, 4 minutes, 5 seconds)`,
                           `${Discord.bold(Discord.inlineCode(`ban-alt-accounts`))}: Whether to also ban Roblox accounts suspected to belong to the player, controlled by Roblox (default: ${Discord.inlineCode(`true`)})`,
                           `${Discord.bold(Discord.inlineCode(`public-ban-reason`))}: If specified, skip the reason modal and display this reason to the temporarily banned player: this must follow ${Discord.hyperlink(`Roblox Community Standards`, `https://help.roblox.com/hc/articles/203313410-Roblox-Community-Standards`)}`
                        ]),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.message} ${prefix}unban ${Discord.underline(Discord.inlineCode(`player`))}`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`player`)))}: Roblox username or player id's ban to revoke`
                        ]),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.message} ${prefix}mass-unban ${Discord.underline(Discord.inlineCode(`player`))} ${Discord.underline(Discord.inlineCode(`player-2`))} ...`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`player`)))}: Roblox username or player id's ban to revoke`
                        ]),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.message} ${prefix}moderation-history ${Discord.underline(Discord.inlineCode(`player`))}`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           `${Discord.underline(Discord.bold(Discord.inlineCode(`player`)))}: Roblox username or player id to fetch moderation history for`
                        ]),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.message} ${prefix}moderation-statistics`, Discord.HeadingLevel.Three),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.message} ${prefix}active-moderations`, Discord.HeadingLevel.Three)
                     ]
                        .join(`\n`)
                  )
                  .setFooter({
                     text: `More information can be found in the "More text-based commands information" button below.`
                  })
            ];


         case `text-based commands:prefixes`: {
            const members = await this.#getMembers();

            return [
               new Discord.EmbedBuilder()
                  .setColor(colours.flooded_area_moderation)
                  .setDescription(
                     [
                        Discord.heading(`${prefix}${Discord.inlineCode(`<command>`)}`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           this.#formatCommand(prefix, members),
                           this.#formatCommand(prefix, members),
                           this.#formatCommand(prefix, members)
                        ]),
                        Discord.heading(`${Discord.userMention(this.#interactionOrMessage.client.user.id)} ${Discord.inlineCode(`<command>`)}`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           this.#formatCommand(`${Discord.userMention(this.#interactionOrMessage.client.user.id)} `, members),
                           this.#formatCommand(`${Discord.userMention(this.#interactionOrMessage.client.user.id)} `, members),
                           this.#formatCommand(`${Discord.userMention(this.#interactionOrMessage.client.user.id)} `, members)
                        ])
                     ]
                        .join(`\n`)
                  )
            ];
         };


         default:
            const [ _menu, _submenu, commandName ] = this.#selectedMenu.split(`:`);
            const command = commands.find(command => (command.action ?? command.commandName) === commandName) ?? commands[0];

            const commandsList = [];
            const maxSize = Math.ceil(command.acceptedNames.length / 3);
            for (let i = 0; i < command.acceptedNames.length; i += maxSize)
               commandsList.push(
                  command.acceptedNames.slice(i, i + maxSize)
               );

            return [
               new Discord.EmbedBuilder()
                  .setColor(colours.flooded_area_moderation)
                  .setDescription(
                     Discord.heading(`${this.#interactionOrMessage.client.allEmojis.forum_channel} Aliases for ${prefix}${command.action ?? command.commandName}`, Discord.HeadingLevel.Three)
                  )
                  .setFields(
                     commandsList.map(acceptedNames =>
                        ({
                           name: `\u200b`,
                           value: Discord.unorderedList(
                              acceptedNames.map(acceptedName => Discord.bold(`${prefix}${Discord.escapeMarkdown(acceptedName)}`))
                           ),
                           inline: true
                        })
                     )
                  )
            ];



         case `text-based commands:chaining moderation commands`: {
            const members = await this.#getMembers();

            return [
               new Discord.EmbedBuilder()
                  .setColor(colours.flooded_area_moderation)
                  .setDescription(
                     [
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.copy_message_link} Multiple commands can be run at once by putting each command on a new line`, Discord.HeadingLevel.Three),
                        this.#formatCommand(prefix, members, true),
                        this.#formatCommand(prefix, members, true),
                        this.#formatCommand(prefix, members, true),
                        this.#formatCommand(prefix, members, true),
                        this.#formatCommand(prefix, members, true),
                        Discord.heading(`${this.#interactionOrMessage.client.allEmojis.context_menu_command} Notes`, Discord.HeadingLevel.Three),
                        Discord.unorderedList([
                           `Chaining commands only works with moderation commands:`,
                           commands
                              .filter(command => command.commandName === `moderate-players`)
                              .map(command => Discord.bold(`${this.#interactionOrMessage.client.allEmojis.message} ${prefix}${command.action}`)),
                           `The total number of moderated users per command message must be 10 or few players`
                        ])
                     ]
                        .join(`\n`)
                  )
            ];
         };
      };
   };


   async #editMessage(payload) {
      if (this.#interactionOrMessage instanceof Discord.Message)
         await this.#interactionOrMessage.reply(payload);
      else
         await this.#interactionOrMessage.editReply(payload);
   };


   async showCommands() {
      // embeds
      const embeds = await this.#getEmbeds();


      // components
      const components = [
         new Discord.ActionRowBuilder()
            .setComponents(
               new Discord.StringSelectMenuBuilder()
                  .setCustomId(`commands:0`)
                  .setPlaceholder(`Select command types`)
                  .setOptions(
                     new Discord.StringSelectMenuOptionBuilder()
                        .setLabel(`Slash commands`)
                        .setValue(`chat-input application commands`)
                        .setEmoji(this.#interactionOrMessage.client.allEmojis.slash_command)
                        .setDefault(this.#selectedMenu === `chat-input application commands`),
                     new Discord.StringSelectMenuOptionBuilder()
                        .setLabel(`Text-based commands`)
                        .setValue(`text-based commands`)
                        .setEmoji(this.#interactionOrMessage.client.allEmojis.message)
                        .setDefault(this.#selectedMenu.startsWith(`text-based commands`))
                  )
            ),

         ...this.#selectedMenu.startsWith(`text-based commands`)
            ? [
               new Discord.ActionRowBuilder()
                  .setComponents(
                     new Discord.StringSelectMenuBuilder()
                        .setCustomId(`commands:1`)
                        .setPlaceholder(`Select command information`)
                        .setOptions(
                           new Discord.StringSelectMenuOptionBuilder()
                              .setLabel(`Text-based commands`)
                              .setValue(`text-based commands`)
                              .setEmoji(this.#interactionOrMessage.client.allEmojis.message)
                              .setDefault(this.#selectedMenu === `text-based commands`),
                           new Discord.StringSelectMenuOptionBuilder()
                              .setLabel(`Prefixes`)
                              .setValue(`text-based commands:prefixes`)
                              .setEmoji(this.#interactionOrMessage.client.allEmojis.forum_channel)
                              .setDefault(this.#selectedMenu === `text-based commands:prefixes`),
                           new Discord.StringSelectMenuOptionBuilder()
                              .setLabel(`Text-based command aliases`)
                              .setValue(`text-based commands:text-based command aliases`)
                              .setEmoji(this.#interactionOrMessage.client.allEmojis.read_all)
                              .setDefault(this.#selectedMenu.startsWith(`text-based commands:text-based command aliases`)),
                           new Discord.StringSelectMenuOptionBuilder()
                              .setLabel(`Chaining moderation commands`)
                              .setValue(`text-based commands:chaining moderation commands`)
                              .setEmoji(this.#interactionOrMessage.client.allEmojis.copy_message_link)
                              .setDefault(this.#selectedMenu === `text-based commands:chaining moderation commands`)
                        )
                  )
            ]
            : [],

         ...this.#selectedMenu.startsWith(`text-based commands:text-based command aliases`)
            ? [
               new Discord.ActionRowBuilder()
                  .setComponents(
                     new Discord.StringSelectMenuBuilder()
                        .setCustomId(`commands:2`)
                        .setPlaceholder(`Select a text-based command`)
                        .setOptions(
                           commands.map((command, i) =>
                              new Discord.StringSelectMenuOptionBuilder()
                                 .setLabel(`${prefix}${command.action ?? command.commandName}`)
                                 .setValue(`text-based commands:text-based command aliases:${command.action ?? command.commandName}`)
                                 .setEmoji(this.#interactionOrMessage.client.allEmojis.message)
                                 .setDefault(
                                    this.#selectedMenu === `text-based commands:text-based command aliases`
                                       ? !i
                                       : this.#selectedMenu === `text-based commands:text-based command aliases:${command.action ?? command.commandName}`
                                 )
                           )
                        )
                  )
            ]
            : []
      ];


      // edit the message
      await this.#editMessage({
         embeds,
         components,
         allowedMentions: {
            repliedUser: false
         }
      });
   };
};