import fs from "node:fs/promises";
import { getRelativeAbsolutePath } from "@magicalbunny31/pawesome-utility-stuffs";


const dotenvKeyFile = getRelativeAbsolutePath(`..`, `..`, `DOTENV_KEY`);

const dotenvKey = await (async () => {
   try {
      const file = await fs.readFile(dotenvKeyFile);
      return file.toString();
   } catch (error) {
      return undefined;
   };
})();


export default dotenvKey;