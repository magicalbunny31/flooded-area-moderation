import { Message } from "./client";
import { GetUserResponse, MultiGetByUsernameRequest } from "./roblox";


export type Action = "ban" | "temp-ban" | "revoke-ban";

export interface ModerationData {
   action: Action;
   player: string;
   length: number?;
   excludeAltAccounts: boolean;
   displayReason: string?;
   privateReason: string?;
};


interface PlayerData {
   id:          number;
   displayName: string;
   username:    string;
   avatar:      string?;
};

interface DiscordModeratorData {
   username: string;
   id:       string;
};

interface MessageData {
   guildId: string;
   channelId: string;
   messageId: string;
   embedIndex: number;
};

export interface ProcessedModerationData {
   action: Action;
   player: PlayerData;
   length: number?;
   excludeAltAccounts: boolean;
   displayReason: string?;
   privateReason: string?;
   discordModerator: discordModeratorData;
   message: MessageData;
};


export type PartialModerationData = Omit<ProcessedModerationData, "discordModerator" | "message">;


type ModerationError = "malformed command" | "invalid length" | "unknown player";

export interface ProcessedModerationErrorData {
   error: ModerationError;
   player?: string;
};


interface PartialPlayerDataName {
   id: number;
   displayName: string;
   name: string;
   avatar: string | null;
};

interface PartialPlayerDataUsername {
   id: number;
   displayName: string;
   username: string;
   avatar: string | null;
};

export type PartialPlayerData = PartialPlayerDataName | PartialPlayerDataUsername;


export declare async function resolvePlayerData<PlayerDataIfId extends GetUserResponse, PlayerDataIfUsername extends MultiGetByUsernameRequest>(
   message: Message,
   playerDataIfId: PlayerDataIfId,
   playerDataIfUsername: PlayerDataIfUsername
): Promise<(PlayerDataIfId | PlayerDataIfUsername)?>;


export interface ParsedModerationData {
   id: number;
   action: Action;
   length: number?;
   excludeAltAccounts: boolean;
   reason: {
      display: string?;
      private: string?;
   };
   moderator: {
      roblox?: number | string;
      discord?: string;
   };
   message: {
      command: string?;
      log: string?;
   };
};


export type ModerationHistoryType = "7" | "30" | "all";