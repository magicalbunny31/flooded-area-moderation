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