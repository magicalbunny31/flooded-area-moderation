import pkg from "../../package.json" with { type: "json" };

import { userAgent } from "@magicalbunny31/pawesome-utility-stuffs";


const [ _fluffleStack, floodedAreaModerationDiscord ] = pkg.name.split(`/`);
const email = `hewwo@nuzzles.dev`;


export default userAgent(floodedAreaModerationDiscord, pkg.version, pkg.homepage, email);