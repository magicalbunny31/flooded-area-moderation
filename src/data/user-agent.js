import fs from "node:fs/promises";
import os from "node:os";


const pkgPath = `./package.json`;
const pkg = JSON.parse(await fs.readFile(pkgPath));

const email = process.env.USER_AGENT_EMAIL;


export default `${pkg.name}/${pkg.version} (Node.js/${process.versions.node}; ${os.type()} ${os.release()}; ${os.arch()}; +${pkg.homepage}; contact:${email})`;