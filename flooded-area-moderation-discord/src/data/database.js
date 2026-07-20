import { isFirestore } from "./config.js";


/**
 * @param {import("@flooded-area-moderation-types/client").default} client
 * @param {number} universeId
 * @param {number} playerId
 * @returns {Promise<import("@flooded-area-moderation-types/moderations").ParsedModerationData[]>}
 */
export const getPlayerModerationHistory = async (client, universeId, playerId) => {
   if (isFirestore) { // use google cloud's firestore
      const moderationHistoryColRef  = client.firestore.collection(`universes`).doc(`${universeId}`).collection(`players`).doc(`${playerId}`).collection(`moderation-history`);
      const moderationHistoryColSnap = await moderationHistoryColRef.get();
      const moderationHistoryColDocs = moderationHistoryColSnap.docs;

      return moderationHistoryColDocs.map(moderationHistoryDocSnap => {
         const moderationHistoryDocData = moderationHistoryDocSnap.data();
         return {
            id: +moderationHistoryDocSnap.id,
            ...moderationHistoryDocData
         };
      });


   } else { // use node.js sqlite
      const toParsedModerationData = record => ({
         id: record.moderation_history_id,
         action: record.action,
         length: record.length,
         excludeAltAccounts: !!record.exclude_alt_accounts,
         reason: {
            display: record.reason_display,
            private: record.reason_private
         },
         moderator: {
            roblox: record.moderator_roblox,
            discord: record.moderator_discord
         },
         message: {
            command: record.message_command,
            log: record.message_log
         }
      });

      const records = client.sqlite
         .prepare(`
            SELECT * from moderation_history
            WHERE universe_id = ? AND player_id = ?
            ORDER BY moderation_history_id
         `)
         .all(universeId, playerId);

      return records.map(record =>
         toParsedModerationData(record)
      );
   };
};


/**
 * @param {import("@flooded-area-moderation-types/client").default} client
 * @param {number} universeId
 * @param {number} playerId
 * @param {number} moderationHistoryId
 * @param {import("@flooded-area-moderation-types/moderations").ProcessedModerationData} processedModeration
 * @param {string} messageCommandUrl
 * @param {string} messageLogUrl
 */
export const setPlayerModerationHistory = async (client, universeId, playerId, moderationHistoryId, processedModeration, messageCommandUrl, messageLogUrl) => {
   if (isFirestore) { // use google cloud's firestore
      const moderationHistoryDocRef = client.firestore.collection(`universes`).doc(`${universeId}`).collection(`players`).doc(`${playerId}`).collection(`moderation-history`).doc(`${moderationHistoryId}`);
      await moderationHistoryDocRef.set({
         action: processedModeration.action,
         length: processedModeration?.length ?? null,
         excludeAltAccounts: processedModeration.excludeAltAccounts ?? null,
         reason: {
            display: processedModeration.displayReason ?? null,
            private: processedModeration.privateReason ?? null
         },
         moderator: {
            discord: processedModeration.discordModerator.id
         },
         message: {
            command: messageCommandUrl,
            log: messageLogUrl
         }
      });


   } else { // use node.js sqlite
      client.sqlite
         .prepare(`
            INSERT INTO players (player_id)
            VALUES (?)
            ON CONFLICT(player_id) DO NOTHING;
         `)
         .run(playerId);

      client.sqlite
         .prepare(`
            INSERT INTO moderation_history (universe_id, player_id, moderation_history_id, action, exclude_alt_accounts, length, reason_display, reason_private, moderator_discord, message_command, message_log)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
         `)
         .run(
            universeId,
            playerId,
            moderationHistoryId,
            processedModeration.action,
            +processedModeration.excludeAltAccounts,
            processedModeration.length ?? null,
            processedModeration.displayReason ?? null,
            processedModeration.privateReason ?? null,
            processedModeration.discordModerator.id,
            messageCommandUrl,
            messageLogUrl
         );
   };
};


/**
 * @param {import("@flooded-area-moderation-types/client").default} client
 * @param {number} universeId
 * @param {number} bloxlinkLinkedAccountPlayerId
 * @param {string} userId
 * @returns {Promise<import("@flooded-area-moderation-types/moderations").ParsedModerationDataStatistics[][]>}
 */
export const getModerationHistory = async (client, universeId, bloxlinkLinkedAccountPlayerId, userId) => {
   if (isFirestore) { // use google cloud's firestore
      /**
       * @param {import("@google-cloud/firestore").Query} moderationHistoryQuery
       */
      const mapModerationHistory = async moderationHistoryQuery => {
         if (!moderationHistoryQuery)
            return undefined;

         const moderationHistorySnap = await moderationHistoryQuery.get();
         const moderationHistoryDocs = moderationHistorySnap.docs
            .filter(moderationHistoryDoc => {
               const moderationHistoryDocUniverseId = +moderationHistoryDoc.ref.parent.parent.parent.parent.id;
               return moderationHistoryDocUniverseId === universeId;
            })
            .map(moderationHistoryDoc => {
               const moderationHistoryDocPlayerId = +moderationHistoryDoc.ref.parent.parent.id;
               const moderationHistoryDocData     = moderationHistoryDoc.data();
               return {
                  id: +moderationHistoryDoc.id,
                  action: moderationHistoryDocData.action,
                  playerId: moderationHistoryDocPlayerId
               };
            });

         return moderationHistoryDocs;
      };

      const moderationHistoryColGroup     = client.firestore.collectionGroup(`moderation-history`);
      const moderationHistoryQueryRoblox  = bloxlinkLinkedAccountPlayerId ? moderationHistoryColGroup.where(`moderator.roblox`,  `==`, bloxlinkLinkedAccountPlayerId) : undefined;
      const moderationHistoryQueryDiscord =                                 moderationHistoryColGroup.where(`moderator.discord`, `==`, userId);


      return [
         await mapModerationHistory(moderationHistoryQueryRoblox),
         await mapModerationHistory(moderationHistoryQueryDiscord)
      ];


   } else { // use node.js sqlite
      const toParsedModerationDataStatistics = record => ({
         id: record.moderation_history_id,
         action: record.action,
         playerId: record.player_id
      });

      const getRecords = (isRoblox, robloxOrDiscordValue) => client.sqlite
         .prepare(`
            SELECT player_id, moderation_history_id, action from moderation_history
            WHERE universe_id = ? AND moderator_${isRoblox ? `roblox` : `discord`} = ?
            ORDER BY moderation_history_id
         `)
         .all(universeId, robloxOrDiscordValue);

      const robloxRecords  = bloxlinkLinkedAccountPlayerId ? getRecords(true,  bloxlinkLinkedAccountPlayerId) : undefined;
      const discordRecords =                                 getRecords(false, userId);

      return [
         robloxRecords?.map(record => toParsedModerationDataStatistics(record)),
         discordRecords.map(record => toParsedModerationDataStatistics(record))
      ];
   };
};