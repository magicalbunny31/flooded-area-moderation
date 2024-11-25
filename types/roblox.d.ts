import Discord from "discord.js";


/**
 * bloxlink
 * @see https://blox.link/dashboard/user/developer
 */
export declare async function discordToRoblox(guildId: Discord.Snowflake, userId: Discord.Snowflake): Promise<string?>;


/**
 * bloxlink
 * @see https://blox.link/dashboard/user/developer
 */
export declare async function robloxToDiscord(guildId: Discord.Snowflake, playerId: number): Promise<Discord.Snowflake[]?>;


/**
 * legacy
 * @see https://create.roblox.com/docs/cloud/legacy/users/v1#/Users/get_v1_users__userId_
 */
interface GetUserResponse {
   description: string;
   created: string;
   isBanned: boolean;
   externalAppDisplayName: string;
   hasVerifiedBadge: boolean;
   id: PlayerId;
   name: string;
   displayName: string;
};


/**
 * legacy
 * @see https://create.roblox.com/docs/cloud/legacy/users/v1#/Users/get_v1_users__userId_
 */
export declare async function getUserByUserId<PlayerId extends number>(userId: PlayerId): Promise<GetUserResponse?>;



/**
 * legacy
 * @see https://create.roblox.com/docs/cloud/legacy/users/v1#/Users/post_v1_usernames_users
 */
interface MultiGetByUsernameRequest<RequestedUsername> extends Omit<GetUserResponse, "description" | "created" | "isBanned" | "externalAppDisplayName"> {
   requestedUsername: RequestedUsername;
};


/**
 * legacy
 * @see https://create.roblox.com/docs/cloud/legacy/users/v1#/Users/post_v1_usernames_users
 */
export declare async function getUsersByUsernames(usernames: string[], excludeBannedUsers: boolean = false): Promise<MultiGetByUsernameRequest<string>[]?>;


/**
 * legacy
 * @see https://create.roblox.com/docs/cloud/legacy/users/v1#/Users/post_v1_usernames_users
 */
export declare async function getUserByUsername<RequestedUsername extends string>(
   username: RequestedUsername,
   excludeBannedUsers: boolean = false
): Promise<MultiGetByUsernameRequest<RequestedUsername>?>;


/**
 * legacy
 * @see https://create.roblox.com/docs/cloud/legacy/thumbnails/v1#/Avatar/get_v1_users_avatar_headshot
 */
type thumbnailSize = "48x48" | "50x50" | "60x60" | "75x75" | "100x100" | "110x110" | "150x150" | "180x180" | "352x352" | "420x420" | "720x720";


/**
 * legacy
 * @see https://create.roblox.com/docs/cloud/legacy/thumbnails/v1#/Avatar/get_v1_users_avatar_headshot
 */
type thumbnailFormat = "Png" | "Jpeg" | "Webp";


/**
 * legacy
 * @see https://create.roblox.com/docs/cloud/legacy/thumbnails/v1#/Avatar/get_v1_users_avatar_headshot
 */
type state = "Error" | "Completed" | "InReview" | "Pending" | "Blocked" | "TemporarilyUnavailable";


/**
 * legacy
 * @see https://create.roblox.com/docs/cloud/legacy/thumbnails/v1#/Avatar/get_v1_users_avatar_headshot
 */
interface ThumbnailResponse<PlayerId> {
   targetId: PlayerId;
   state: state;
   imageUrl: string,
   version: string
};


/**
 * legacy
 * @see https://create.roblox.com/docs/cloud/legacy/thumbnails/v1#/Avatar/get_v1_users_avatar_headshot
 */
export declare async function getAvatarHeadshotsByUserIds(
   userIds: number[],
   size: thumbnailSize = `48x48`,
   format: thumbnailFormat = `Png`,
   isCircular: boolean = false
): Promise<ThumbnailResponse<number>[]?>;


/**
 * legacy
 * @see https://create.roblox.com/docs/cloud/legacy/thumbnails/v1#/Avatar/get_v1_users_avatar_headshot
 */
export declare async function getAvatarHeadshotByUserId<PlayerId extends number>(
   userId: PlayerId,
   size: thumbnailSize = `48x48`,
   format: thumbnailFormat = `Png`,
   isCircular: boolean = false
): Promise<ThumbnailResponse<PlayerId>?>;


/**
 * legacy
 */
export declare function getUserProfileLinkFromUserId<PlayerId extends number>(userId: PlayerId): `https://www.roblox.com/users/${PlayerId}/profile`;


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#UserRestriction
 */
interface GameJoinRestriction<Duration> {
   active: boolean;
   startTime: string;
   duration?: `${Duration}s`;
   privateReason: string;
   displayReason: string;
   excludeAltAccounts: boolean;
   inherited: boolean;
};


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#UserRestriction
 */
interface GameJoinRestrictionPermanent {
   active: boolean;
   startTime: string;
   privateReason: string;
   displayReason: string;
   excludeAltAccounts: boolean;
   inherited: boolean;
};


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#UserRestriction
 */
interface GameJoinRestrictionRemove {
   active: false;
   startTime: string;
   privateReason: "";
   displayReason: "";
   excludeAltAccounts: boolean;
   inherited: boolean;
};


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#UserRestriction
 */
interface BaseUserRestriction<UniverseId, PlayerId> {
   path: `universes/${UniverseId}/user-restrictions/${PlayerId}`;
   updateTime: string;
   user: `users/${PlayerId}`;
};


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#UserRestriction
 */
interface UserRestrictionTemporary<UniverseId, PlayerId, Duration> extends BaseUserRestriction<UniverseId, Player> {
   gameJoinRestriction: GameJoinRestriction<Duration>;
};


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#UserRestriction
 */
interface UserRestrictionPermanent<UniverseId, Player> extends BaseUserRestriction<UniverseId, Player> {
   gameJoinRestriction: GameJoinRestrictionPermanent;
};


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#UserRestriction
 */
interface UserRestrictionRemove<UniverseId, Player> extends BaseUserRestriction<UniverseId, Player> {
   gameJoinRestriction: Omit<GameJoinRestrictionRemove, "startTime">;
};


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#UserRestriction
 */
export type UserRestriction = UserRestrictionTemporary<number, number, number> | UserRestrictionPermanent<number, number> | UserRestrictionRemove<number, number>;


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#List-User-Restriction-Logs
 */
interface UserRestrictionLog<PlayerId> extends Omit<GameJoinRestriction<number>, "inherited"> {
   user: `users/${PlayerId}`;
   place: string;
   moderator: {
      robloxUser: `users/${number}`;
   };
   createTime: string;
};


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#List-User-Restriction-Logs
 */
interface UserRestrictionLogs<PlayerId> {
   logs: UserRestrictionLog<PlayerId>[],
   nextPageToken: string;
};


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#List-User-Restrictions
 */
interface UserRestrictions<PlayerId> {
   userRestrictions: UserRestriction[],
   nextPageToken: string;
};


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#Update-User-Restriction
 */
export declare async function banUser<UniverseId extends number, PlayerId extends number, Duration extends number>(
   universeId: UniverseId,
   playerId: PlayerId,
   duration: Duration,
   privateReason: string,
   displayReason: string,
   excludeAltAccounts: boolean
): Promise<UserRestrictionTemporary<UniverseId, PlayerId, Duration>?>;


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#Update-User-Restriction
 */
export declare async function banUser<UniverseId extends number, PlayerId extends number>(
   universeId: UniverseId,
   playerId: PlayerId,
   duration: undefined,
   privateReason: string,
   displayReason: string,
   excludeAltAccounts: boolean
): Promise<UserRestrictionPermanent<UniverseId, PlayerId>?>;


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#Update-User-Restriction
 */
export declare async function revokeUserBan<UniverseId extends number, PlayerId extends number>(
   universeId: UniverseId,
   playerId: PlayerId
): Promise<UserRestrictionRemove<UniverseId, PlayerId>?>;


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#List-User-Restriction-Logs
 */
export declare async function getModerationLogs<PlayerId extends number>(
   universeId: number,
   playerId: PlayerId,
   maxPageSize: number = 100,
   nextPageToken?: string
): Promise<UserRestrictionLogs<PlayerId>?>;


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#List-User-Restrictions
 */
export declare async function listModerations(
   universeId: number,
   maxPageSize: number = 100,
   filterActive: boolean = true,
   nextPageToken?: string
): Promise<UserRestrictions?>;


/**
 * cloud
 * @see https://create.roblox.com/docs/cloud/reference/UserRestriction#Get-User-Restriction
 */
export declare async function getUserRestriction<UniverseId extends number, PlayerId extends number>(
   universeId: UniverseId,
   playerId: PlayerId
): Promise<UserRestrictionTemporary<UniverseId, PlayerId, number>?>;