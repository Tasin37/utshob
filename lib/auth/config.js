import { createAuth } from "./create.js";
import { getPool } from "../db/pool.js";

export const auth = createAuth(getPool());