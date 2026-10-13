# Friends and rivals (P40)

Proposed and approved 2026-10-13 as D143. Barry picked the roadmap's v1.2 "Friends/rivals" row as the next feature and left the open questions to the lead ("you can decide how to best handle the questions"). [Settled points](#settled-points) records each decision.

Companions: [roadmap](roadmap.md) (the v1.2 row: "public-profile privacy and moderation; no friend requirement to progress"), [decisions](decisions.md) (D109 public profiles, D110 raids, D141 meetings, D142 names), [leaderboards](leaderboards.md) (name masking) and [companion](companion.md).

## The idea in one paragraph

Raids and meetings show that other people are playing, but the names drift past and are gone. Following keeps them. From a hero's public page you can follow that player. The Rankings page gets a Following card listing everyone you follow: their hero, level, floor and all-time rank, each linking to their page. You can mark one followed hero as your rival. The rival sits at the top of the card beside your own hero, so you can see at a glance who is ahead. Following changes nothing in play and nobody needs to follow anyone.

## What a player sees

- On a public hero page, signed in: a **Follow** button. After following, it changes to **Following** with **Unfollow** and **Make rival** beside it.
- On Rankings, above the lifetime records, a **Following** card. Each followed hero shows their public name, hero name, class, level, what they're doing and where, and their all-time rank, and links to their page. Each row has **Make rival** and **Unfollow**.
- The rival row comes first and has a short head-to-head line: "You're 2 levels ahead" or "Quill is 3 places ahead of you".
- A followed hero who has made their page private again shows as "Page is private" with only their public name. If the player renamed themselves, was suspended or deleted their progress, the row shows "No longer here" with Unfollow.
- Nothing appears on the device, in the adventure log, or in push alerts. The followed player is never told and sees no list or count of followers.

## Rules

- **Who can be followed.** Only a hero whose public page is on (D109), so following reveals nothing a stranger can't already see on that page. The follow button lives on the public page, which leaderboards, raids and meetings already link to.
- **Follows are per account, not per hero.** They follow the player's current hero, the way the public page does. A roster switch (D136) shows the new current hero, or "Page is private" until that hero opts in.
- **Limits.** Up to 20 follows per account. One rival at a time, chosen from your follows. Unfollowing your rival clears the rival.
- **Renames break follows.** Each follow stores the followed player's public-name version (D142). If they change their public name, the follow shows "No longer here" instead of following them to the new name. This is the same rule that masks renamed names on leaderboards and in raid logs. It also gives anyone who wants to shake off followers an easy way out without a block list.
- **No follower lists.** No query returns who follows a given player, and no count is shown anywhere. With nothing visible to the followed player, there's nothing to moderate beyond what public pages and names already cover.
- **Not yourself.** Your own page shows no Follow button, and the server refuses it.

## Data and reads

One new table, `follows`: `userId` (follower), `followedUserId`, `followedNameVersion`, optional `rival: true`, `createdAt`. Indexes `by_userId_and_followedUserId` and `by_followedUserId`. The second index is used only by deletion.

- `follows.follow(operationId, alias)`, `follows.unfollow(operationId, followId)` and `follows.setRival(operationId, followId | null)` are receipted intents (`runIntent`). Follow resolves the alias with the same checks as `profiles.view`: an active, non-repair owner whose current hero is activated and public. Every way that can fail returns the same `NOT_FOUND` the public page shows. Following an already-followed player whose name version has changed refreshes the stored version.
- `follows.list` returns the signed-in owner's follows, rival first, then newest first. Each row reads at most the owner, its game profile and current hero, and one rank row from the published set. That's at most 20 rows of fixed reads, with no scans and no reads of other players' follows.
- `follows.status(alias)` tells the public page whether to show Follow, Following or nothing (signed out, own page, or not followable).
- Deletion: Desk Crawler progress deletion and account deletion remove the player's own follows and every follow pointing at them, in bounded batches inside the existing jobs.
- Analytics (consenting players only): `hero followed` and `rival set`, with no names or ids.

No content, simulation, scene or device payload change. Old payloads and templates keep their meaning.

## Settled points

1. **Follow only public heroes.** The alternative, following any name seen on a board or log, would show a private hero's level and floor to strangers, which D109 deliberately hides.
2. **One-way, silent following, no requests.** Mutual friends need requests, notifications and blocking, which is a lot of surface for a game with no chat. One-way following of public pages needs none of it.
3. **A rival is a label, not a mechanic.** Making a rival more likely to be raided or met would turn a social label into targeting, which the raid design rules out ("no opt-out, odds set by stance alone"). The head-to-head line is enough to make it matter.
4. **Rename resets follows.** It matches how every other copied name in the game is masked, and it is the escape hatch for unwanted followers.
5. **Companion only for now.** A rival line on the device is the natural next step, but it changes the device payload and needs layout previews in all four layouts. It is left for a later slice, once there's data on how many players set a rival.

## Gate

Following never affects play or ranking. Every read is bounded by the 20-follow cap. Nothing tells a player who follows them. Deletion leaves no rows behind in either direction. The roadmap asks to measure follow adoption without making it a launch blocker, which is what the two analytics events are for.
