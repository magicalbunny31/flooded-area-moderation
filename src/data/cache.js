import NodeCache from "node-cache";


const OneDay = 24 * 60 * 60;

export default new NodeCache({ stdTTL: OneDay });