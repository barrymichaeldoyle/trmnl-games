/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements from "../achievements.js";
import type * as admin from "../admin.js";
import type * as alerts from "../alerts.js";
import type * as alertsPush from "../alertsPush.js";
import type * as analytics from "../analytics.js";
import type * as connections from "../connections.js";
import type * as crons from "../crons.js";
import type * as deletion from "../deletion.js";
import type * as devSeed from "../devSeed.js";
import type * as feedback from "../feedback.js";
import type * as follows from "../follows.js";
import type * as heroes from "../heroes.js";
import type * as http from "../http.js";
import type * as idleAngler_achievements from "../idleAngler/achievements.js";
import type * as idleAngler_adapter from "../idleAngler/adapter.js";
import type * as idleAngler_anglers from "../idleAngler/anglers.js";
import type * as idleAngler_dockFull from "../idleAngler/dockFull.js";
import type * as idleAngler_flies from "../idleAngler/flies.js";
import type * as idleAngler_full from "../idleAngler/full.js";
import type * as idleAngler_leaderboard from "../idleAngler/leaderboard.js";
import type * as idleAngler_lifecycle from "../idleAngler/lifecycle.js";
import type * as idleAngler_operations from "../idleAngler/operations.js";
import type * as idleAngler_payload from "../idleAngler/payload.js";
import type * as idleAngler_profile from "../idleAngler/profile.js";
import type * as idleAngler_purge from "../idleAngler/purge.js";
import type * as idleAngler_records from "../idleAngler/records.js";
import type * as idleAngler_runtime from "../idleAngler/runtime.js";
import type * as idleAngler_tick from "../idleAngler/tick.js";
import type * as idleAngler_validators from "../idleAngler/validators.js";
import type * as incidents from "../incidents.js";
import type * as inventory from "../inventory.js";
import type * as keepsakes from "../keepsakes.js";
import type * as leaderboard from "../leaderboard.js";
import type * as lib_achievements from "../lib/achievements.js";
import type * as lib_adminAccess from "../lib/adminAccess.js";
import type * as lib_alerts from "../lib/alerts.js";
import type * as lib_aliases from "../lib/aliases.js";
import type * as lib_deletionConfirmation from "../lib/deletionConfirmation.js";
import type * as lib_engine_deskCrawler from "../lib/engine/deskCrawler.js";
import type * as lib_engine_publication from "../lib/engine/publication.js";
import type * as lib_engine_runner from "../lib/engine/runner.js";
import type * as lib_engine_runtime from "../lib/engine/runtime.js";
import type * as lib_engine_scores from "../lib/engine/scores.js";
import type * as lib_engine_tables from "../lib/engine/tables.js";
import type * as lib_engine_world from "../lib/engine/world.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_gameHooks from "../lib/gameHooks.js";
import type * as lib_gameProfile from "../lib/gameProfile.js";
import type * as lib_hash from "../lib/hash.js";
import type * as lib_heroCreate from "../lib/heroCreate.js";
import type * as lib_heroScene from "../lib/heroScene.js";
import type * as lib_intent from "../lib/intent.js";
import type * as lib_keepsakes from "../lib/keepsakes.js";
import type * as lib_logDetail from "../lib/logDetail.js";
import type * as lib_lostProperty from "../lib/lostProperty.js";
import type * as lib_meetings from "../lib/meetings.js";
import type * as lib_names from "../lib/names.js";
import type * as lib_publicPage from "../lib/publicPage.js";
import type * as lib_raids from "../lib/raids.js";
import type * as lib_rankingRead from "../lib/rankingRead.js";
import type * as lib_svix from "../lib/svix.js";
import type * as lib_trmnlManagement from "../lib/trmnlManagement.js";
import type * as lostProperty from "../lostProperty.js";
import type * as maintenance from "../maintenance.js";
import type * as meetings from "../meetings.js";
import type * as paperLives_achievements from "../paperLives/achievements.js";
import type * as paperLives_adapter from "../paperLives/adapter.js";
import type * as paperLives_album from "../paperLives/album.js";
import type * as paperLives_lifecycle from "../paperLives/lifecycle.js";
import type * as paperLives_lives from "../paperLives/lives.js";
import type * as paperLives_payload from "../paperLives/payload.js";
import type * as paperLives_profile from "../paperLives/profile.js";
import type * as paperLives_public from "../paperLives/public.js";
import type * as paperLives_publication from "../paperLives/publication.js";
import type * as paperLives_purge from "../paperLives/purge.js";
import type * as paperLives_records from "../paperLives/records.js";
import type * as paperLives_runtime from "../paperLives/runtime.js";
import type * as paperLives_tick from "../paperLives/tick.js";
import type * as paperLives_validators from "../paperLives/validators.js";
import type * as platform from "../platform.js";
import type * as platformProfile from "../platformProfile.js";
import type * as profiles from "../profiles.js";
import type * as raids from "../raids.js";
import type * as roster from "../roster.js";
import type * as sim_runs_adapter from "../sim/runs/adapter.js";
import type * as sim_runs_tick from "../sim/runs/tick.js";
import type * as trmnl from "../trmnl.js";
import type * as trmnlPayload from "../trmnlPayload.js";
import type * as users from "../users.js";
import type * as world from "../world.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  admin: typeof admin;
  alerts: typeof alerts;
  alertsPush: typeof alertsPush;
  analytics: typeof analytics;
  connections: typeof connections;
  crons: typeof crons;
  deletion: typeof deletion;
  devSeed: typeof devSeed;
  feedback: typeof feedback;
  follows: typeof follows;
  heroes: typeof heroes;
  http: typeof http;
  "idleAngler/achievements": typeof idleAngler_achievements;
  "idleAngler/adapter": typeof idleAngler_adapter;
  "idleAngler/anglers": typeof idleAngler_anglers;
  "idleAngler/dockFull": typeof idleAngler_dockFull;
  "idleAngler/flies": typeof idleAngler_flies;
  "idleAngler/full": typeof idleAngler_full;
  "idleAngler/leaderboard": typeof idleAngler_leaderboard;
  "idleAngler/lifecycle": typeof idleAngler_lifecycle;
  "idleAngler/operations": typeof idleAngler_operations;
  "idleAngler/payload": typeof idleAngler_payload;
  "idleAngler/profile": typeof idleAngler_profile;
  "idleAngler/purge": typeof idleAngler_purge;
  "idleAngler/records": typeof idleAngler_records;
  "idleAngler/runtime": typeof idleAngler_runtime;
  "idleAngler/tick": typeof idleAngler_tick;
  "idleAngler/validators": typeof idleAngler_validators;
  incidents: typeof incidents;
  inventory: typeof inventory;
  keepsakes: typeof keepsakes;
  leaderboard: typeof leaderboard;
  "lib/achievements": typeof lib_achievements;
  "lib/adminAccess": typeof lib_adminAccess;
  "lib/alerts": typeof lib_alerts;
  "lib/aliases": typeof lib_aliases;
  "lib/deletionConfirmation": typeof lib_deletionConfirmation;
  "lib/engine/deskCrawler": typeof lib_engine_deskCrawler;
  "lib/engine/publication": typeof lib_engine_publication;
  "lib/engine/runner": typeof lib_engine_runner;
  "lib/engine/runtime": typeof lib_engine_runtime;
  "lib/engine/scores": typeof lib_engine_scores;
  "lib/engine/tables": typeof lib_engine_tables;
  "lib/engine/world": typeof lib_engine_world;
  "lib/errors": typeof lib_errors;
  "lib/gameHooks": typeof lib_gameHooks;
  "lib/gameProfile": typeof lib_gameProfile;
  "lib/hash": typeof lib_hash;
  "lib/heroCreate": typeof lib_heroCreate;
  "lib/heroScene": typeof lib_heroScene;
  "lib/intent": typeof lib_intent;
  "lib/keepsakes": typeof lib_keepsakes;
  "lib/logDetail": typeof lib_logDetail;
  "lib/lostProperty": typeof lib_lostProperty;
  "lib/meetings": typeof lib_meetings;
  "lib/names": typeof lib_names;
  "lib/publicPage": typeof lib_publicPage;
  "lib/raids": typeof lib_raids;
  "lib/rankingRead": typeof lib_rankingRead;
  "lib/svix": typeof lib_svix;
  "lib/trmnlManagement": typeof lib_trmnlManagement;
  lostProperty: typeof lostProperty;
  maintenance: typeof maintenance;
  meetings: typeof meetings;
  "paperLives/achievements": typeof paperLives_achievements;
  "paperLives/adapter": typeof paperLives_adapter;
  "paperLives/album": typeof paperLives_album;
  "paperLives/lifecycle": typeof paperLives_lifecycle;
  "paperLives/lives": typeof paperLives_lives;
  "paperLives/payload": typeof paperLives_payload;
  "paperLives/profile": typeof paperLives_profile;
  "paperLives/public": typeof paperLives_public;
  "paperLives/publication": typeof paperLives_publication;
  "paperLives/purge": typeof paperLives_purge;
  "paperLives/records": typeof paperLives_records;
  "paperLives/runtime": typeof paperLives_runtime;
  "paperLives/tick": typeof paperLives_tick;
  "paperLives/validators": typeof paperLives_validators;
  platform: typeof platform;
  platformProfile: typeof platformProfile;
  profiles: typeof profiles;
  raids: typeof raids;
  roster: typeof roster;
  "sim/runs/adapter": typeof sim_runs_adapter;
  "sim/runs/tick": typeof sim_runs_tick;
  trmnl: typeof trmnl;
  trmnlPayload: typeof trmnlPayload;
  users: typeof users;
  world: typeof world;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
