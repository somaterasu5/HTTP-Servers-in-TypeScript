import { db } from "../index.js";
import { chirps, Chirp } from "../schema.js";

export const createChirp = async (chirp: Chirp) => {
  const [result] = await db
    .insert(chirps)
    .values(chirp)
    .onConflictDoNothing()
    .returning();
  return result;
};
