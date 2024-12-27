import fs from "node:fs/promises";
import { getRelativeAbsolutePath } from "@magicalbunny31/pawesome-utility-stuffs";


const pkgPath = getRelativeAbsolutePath(`..`, `..`, `package.json`);
const pkg = JSON.parse(await fs.readFile(pkgPath));


export default `${pkg.name}/${pkg.version} (${pkg.homepage})`;