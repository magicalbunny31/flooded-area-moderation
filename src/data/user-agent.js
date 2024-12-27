import fs from "node:fs/promises";


const pkgPath = `./package.json`;
const pkg = JSON.parse(await fs.readFile(pkgPath));


export default `${pkg.name}/${pkg.version} (${pkg.homepage})`;