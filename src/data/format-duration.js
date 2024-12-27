import dayjs from "dayjs";


export const toSeconds = duration => {
   // the length in seconds
   let length = 0;

   if (!isNaN(+duration)) { // the argument is the length in seconds
      length = +duration;

   } else { // no, the length isn't in seconds! parse it
      const splitTimes = [ ...duration?.matchAll(/[0-9]+[a-z]/g) || [] ].map(match => match[0]);
      for (const splitTime of splitTimes) {
         const [ unitLength, unit ] = [ ...splitTime.matchAll(/[0-9]+|[a-z]/g) ].map(match => match[0]);
         switch (unit) {
            case `s`: length += +unitLength;          break;
            case `m`: length += +unitLength *     60; break;
            case `h`: length += +unitLength *   3600; break;
            case `d`: length += +unitLength *  86400; break;
            case `w`: length += +unitLength * 604800; break;
         };
      };
   };

   // length too long
   if (length > 315_576_000_000)
      length = undefined;

   // return the length (in seconds)
   return length;
};


export const defaultOptions = [{
   name: `✨ 30 minutes`,
   value: 1800
}, {
   name: `✨ 1 hour`,
   value: 3600
}, {
   name: `✨ 6 hours`,
   value: 21600
}, {
   name: `✨ 1 day`,
   value: 86400
}, {
   name: `✨ 3 days`,
   value: 259200
}, {
   name: `✨ 1 week`,
   value: 604800
}, {
   name: `✨ 2 weeks`,
   value: 1209600
}, {
   name: `✨ 1 month`,
   value: 2592000
}];


export default seconds => {
   const format = [];
   const duration = dayjs.duration(seconds, `seconds`);

   const days = (duration.years() * 365) + (duration.months() * 30) + duration.days();

   if (duration.asDays()    >= 1) format.push(`${days} ${days === 1 ? `day` : `days`}`);
   if (duration.asHours()   >= 1) format.push(`${duration.hours()} ${duration.hours() === 1 ? `hour` : `hours`}`);
   if (duration.asMinutes() >= 1) format.push(`${duration.minutes()} ${duration.minutes() === 1 ? `minute` : `minutes`}`);
   if (duration.asSeconds() >= 1) format.push(`${duration.seconds()} ${duration.seconds() === 1 ? `second` : `seconds`}`);

   return format.join(`, `);
};