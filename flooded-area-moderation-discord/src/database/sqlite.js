import { DatabaseSync } from "node:sqlite";


export const initialiseSqlite = () => {
   // define where the database file is
   const sqlite = new DatabaseSync(`./src/database/sqlite.db`);


   // create the databases if they don't already exist
   sqlite.exec(`
      CREATE TABLE IF NOT EXISTS universes (
         universe_id INTEGER PRIMARY KEY
      );

      CREATE TABLE IF NOT EXISTS players (
         player_id INTEGER PRIMARY KEY
      );

      CREATE TABLE IF NOT EXISTS moderation_history (
         universe_id INTEGER NOT NULL,
         player_id INTEGER NOT NULL,
         moderation_history_id INTEGER NOT NULL,
         action TEXT NOT NULL,
         exclude_alt_accounts INTEGER,
         length INTEGER,
         reason_display TEXT,
         reason_private TEXT,
         moderator_roblox INTEGER,
         moderator_discord TEXT,
         message_command TEXT,
         message_log TEXT,
         PRIMARY KEY (universe_id, player_id, moderation_history_id),
         FOREIGN KEY (universe_id) REFERENCES universes (universe_id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
         FOREIGN KEY (player_id) REFERENCES players (player_id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
      );
   `);


   // return the sqlite object
   return sqlite;
};