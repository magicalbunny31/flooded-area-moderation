import path from "node:path";
import fs from "node:fs/promises";


const dirname = import.meta.dirname;
const dotenvKeyFile = path.join(dirname, `..`, `DOTENV_KEY`);

const dotenvKey = await (async () => {
   try {
      const file = await fs.readFile(dotenvKeyFile);
      return file.toString();
   } catch (error) {
      return undefined;
   };
})();


export default dotenvKey;