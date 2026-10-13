# Friends and rivals (P40)

Proposed and approved 2026-10-13 as D143. Barry picked the roadmap's v1.2 "Friends/rivals" row as the next feature and left the open questions to the lead ("you can decide how to best handle the questions"). [Settled points](#settled-points) records each decision.

Companions: [roadmap](roadmap.md) (the v1.2 row: "public-profile privacy and moderation; no friend requirement to progress"), [decisions](decisions.md) (D109 public profiles, D110 raids, D141 meetings, D142 names), [leaderboards](leaderboards.md) (name masking) and [companion](companion.md).

## The idea in one paragraph

Raids and meetings show that other people are playing, but the names drift past and are gone. Following keeps them. From a hero's public page you can follow that player. The Rankings page gets a Following card listing everyone you follow: their hero, level, floor and all-time rank, each linking to their page. You can mark one followed hero as your rival. The rival sits at the top of the card beside your own hero, so you can see at a glance who is ahead. Following on its own changes nothing in play, and nobody needs to follow anyone. A rival does matter: half your hero's raids go after your rival's desk when they can be raided, and your rival is told who named them, with a Rival back button.

## What a player sees

- On a public hero page, signed in: a **Follow** button. After following, it changes to **Following** with **Unfollow** and **Make rival** beside it.
- On Rankings, above the lifetime records, a **Following** card. Each followed hero shows their public name, hero name, class, level, what they're doing and where, and their all-time rank, and links to their page. Each row has **Make rival** and **Unfollow**.
- The rival row comes first and has a short head-to-head line: "You're 2 levels ahead" or "Quill is 3 places ahead of you".
- A followed hero who has made their page private again shows as "Page is private" with only their public name. If the player renamed themselves, was suspended or deleted their progress, the row shows "No longer here" with Unfollow.
- A player who has been named someone's rival sees a "Named you their rival" box at the top of their own Following card, with each name linking to that player's page and a **Rival back** button. Raids between rivals carry a "Your rival" or "You're their rival" tag on the Raids card, and the rival row counts your raids on them.
- Nothing appears on the device or in push alerts. A plain follow is never shown to the followed player, who sees no list or count of followers.

## Rules

- **Who can be followed.** Only a hero whose public page is on (D109), so following reveals nothing a stranger can't already see on that page. The follow button lives on the public page, which leaderboards, raids and meetings already link to.
- **Follows are per account, not per hero.** They follow the player's current hero, the way the public page does. A roster switch (D136) shows the new current hero, or "Page is private" until that hero opts in.
- **Limits.** Up to 20 follows per account. One rival at a time, chosen from your follows. Unfollowing your rival clears the rival.
- **Renames break follows.** Each follow stores the followed player's public-name version (D142). If they change their public name, the follow shows "No longer here" instead of following them to the new name. This is the same rule that masks renamed names on leaderboards and in raid logs. It also gives anyone who wants to shake off followers an easy way out without a block list.
- **Rival raids.** When a hero launches a raid and its owner has a rival whose page is public and whose current hero can be raided right now (the same checks as any pool pick, including the 24-tick target cooldown), half of those launches go after the rival instead of the pool. The half comes from the raid plan's uniform target shard, not a new draw, so the raid stream, launch odds and simulator are unchanged: a rival changes who gets raided, never how often. When the rival can't be raided, the raid falls back to the ordinary pool pick. The ledger row is marked `rival`, and the follow row counts the raids won and lost.
- **Rivals are told; followers aren't.** No query returns who follows a given player. The one exception is the rival: `follows.list` returns the players who named you their rival (up to 20, then "20+"), while that naming is current. A rename on either side ends it, which is also the way out of an unwanted rivalry.
- **Not yourself.** Your own page shows no Follow button, and the server refuses it.

## Data and reads

One new table, `follows`: `userId` (follower), `followedUserId`, `followedNameVersion`, optional `rival: true`, `raidsWon?`, `raidsLost?`, `createdAt`. Indexes `by_userId_and_followedUserId` and `by_followedUserId_and_rival`. The second index serves deletion and the "named you their rival" list. The `raids` ledger gains an optional `rival: true`.

- `follows.follow(operationId, alias, rival?)` (with `rival` it also makes them the rival: Rival back), `follows.unfollow(operationId, followId)` and `follows.setRival(operationId, followId | null)` are receipted intents (`runIntent`). Follow resolves the alias with the same checks as `profiles.view`: an active, non-repair owner whose current hero is activated and public. Every way that can fail returns the same `NOT_FOUND` the public page shows. Following an already-followed player whose name version has changed refreshes the stored version.
- `follows.list` returns the signed-in owner's follows, rival first, then newest first. Each row reads at most the owner, its game profile and current hero, and one rank row from the published set. That's at most 20 rows of fixed reads, with no scans and no reads of other players' follows.
- `follows.status(alias)` tells the public page whether to show Follow, Following or nothing (signed out, own page, or not followable).
- Deletion: Desk Crawler progress deletion and account deletion remove the player's own follows and every follow pointing at them, in bounded batches inside the existing jobs.
- Analytics (consenting players only): `hero followed` and `rival set`, with no names or ids.

No content, simulation, scene or device payload change. Old payloads and templates keep their meaning.

## Settled points

1. **Follow only public heroes.** The alternative, following any name seen on a board or log, would show a private hero's level and floor to strangers, which D109 deliberately hides.
2. **One-way, silent following, no requests.** Mutual friends need requests, notifications and blocking, which is a lot of surface for a game with no chat. One-way following of public pages needs none of it.
3. **A rival is raided more.** First settled as a label only; Barry changed it the same day because rival raids are funny. Half the raider's launches target the rival when it's raidable. Launch odds and win odds stay set by stance alone, so D110's rule still holds: the rival changes the target, not the odds. Since that is targeting, the rival is told and can rival back.
4. **Rename resets follows.** It matches how every other copied name in the game is masked, and it is the escape hatch for unwanted followers.
5. **Companion only for now.** A rival line on the device is the natural next step, but it changes the device payload and needs layout previews in all four layouts. It is left for a later slice, once there's data on how many players set a rival.

## Gate

A plain follow never affects play or ranking; a rival changes only which hero a raid targets. Every read is bounded by the 20-follow cap. Nothing tells a player who follows them, except that a rival is told who named them. Deletion leaves no rows behind in either direction. The roadmap asks to measure follow adoption without making it a launch blocker, which is what the two analytics events are for.
