import fs from "node:fs/promises";
import path from "node:path";


const pkgPath = path.join(path.dirname(import.meta.dirname), `package.json`);
const pkg = JSON.parse(await fs.readFile(pkgPath));


export default `${pkg.name}/${pkg.version} (${pkg.homepage})`;