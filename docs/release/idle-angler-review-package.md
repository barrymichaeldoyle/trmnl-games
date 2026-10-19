# Idle Angler marketplace review package (draft)

**Status (2026-10-19): ready for Barry's go.** Translated into all eight languages the site speaks (D200). Plugin 568 exists in TRMNL, private, with its icon and URLs; Desk Crawler's listing is approved and live, so the condition in [the S7 checklist](../idle-angler.md#s7-checklist-barry) ("after Desk Crawler is approved") holds. Submitting, the listing edits below, the video and the email are Barry's actions (or need his explicit go for each).

## Listing

| Field | Now in plugin 568 | Proposed |
| --- | --- | --- |
| Name | Idle Angler | Unchanged |
| Description (≤50) | A fishing game that plays itself on your TRMNL (46 characters, saved 2026-10-19) | Done |
| Icon | Saved ([`idle-angler-plugin-icon.png`](../assets/idle-angler-plugin-icon.png), 512×512) | Unchanged |
| Featured image | Regenerated 2026-10-19 from setting 506054 (blob 19680498): night rain at River Bend, 12 of 58 species, Heron Lake just opened, best 3.5 kg rainbow trout. Regenerate once the device shows template v14 | Regenerate with **Generate marketplace preview** on setting 506054 now the angler has catches and a goal. The fictional candidate, drawn from the `listing` preview state on content v2 (17 of 58 species, a goal line, autumn at River Bend), is [`idle-angler-featured.png`](../assets/idle-angler-featured.png) and is also the game page's sample |
| Categories | games, entertainment | Unchanged |
| Refresh | Every 15 minutes | Unchanged |
| Installation URL | `https://trmnlgames.com/connect/trmnl/idle-angler/install` | Unchanged |
| Installation success webhook | `https://exciting-cormorant-948.convex.site/trmnl/idle-angler/install/success` | Unchanged |
| Management URL | `https://trmnlgames.com/connect/trmnl/idle-angler/manage` | Unchanged |
| Markup URL | `https://exciting-cormorant-948.convex.site/trmnl/idle-angler/v1/screen` | Unchanged |
| Uninstall webhook | `https://exciting-cormorant-948.convex.site/trmnl/idle-angler/uninstall` | Unchanged |
| Knowledge base | `https://trmnlgames.com/help/idle-angler` | Unchanged. It answers not-found to everyone but admins until the game is switched to live, so switch it to live (step 3 below) before the reviewer looks |

## Focus-first rationale

Idle Angler is a fishing game for a glance. The angler casts every 15 minutes on its own, day and night; the screen shows the water in its season, time of day and weather, the latest catches and the week's heaviest fish at that water. Every day or two the player opens the companion to sell the catch, restock bait and save for the rods, passes and charter tickets that open new water. Fish caught while the cooler is full are released and still logged, so a player who stays away loses no progress. There are no streaks, no benefit from refreshing, and two optional alerts that are off until turned on. A weekly fly code on the screen adds a cosmetic fly to the player's box. Free, no purchases, no ads.

## Before submitting

1. **Production on content v5** (D199), so the reviewer's first cast lands a fish and reaches the first goal: `cd /Users/barry/dev/trmnl-games/apps/backend && npx convex run --prod idleAngler/operations:setActiveContentVersion '{"contentVersion":"v5"}'`.
2. **Listing**: done 2026-10-19 (description saved, featured image regenerated; the plugin form's Save button does not persist, a fetch POST of the form does).
3. **Switch Idle Angler to live** in the admin page's Games card (audited). Until then the reviewer's install, help and companion pages are not-found. On the same day, merge the `idle-angler-launch-day` branch (sitemap entries, `PRIVACY_UPDATED`, a What's new entry in all eight languages) after setting its two dates to that day.
4. **Record the install video** with the [recording checklist](recording-checklist.md)'s shots, for Idle Angler: Install → Connect, sign up and pick a public name, Save, the first screen ("Wren is ready to fish"), then the first cast with its fish after the next quarter hour (an honest cut caption), the Dock with the goal's Claim, the Cooler and a sale, Configure.
5. **Submit for Review** in My Plugins, then send the [email](../idle-angler-review-email.md).

## Reviewer access

- Install from the plugin page; sign up on the companion with any email (one-time code), Google or GitHub. No passwords to share and no bypass.
- Pick a public name, click Connect, then Save in TRMNL. The first cast lands a fish within 15 minutes.
- Companion: `https://trmnlgames.com/app/idle-angler`. A player who already has a TRMNL Games account (from Desk Crawler) signs in with it and plays both. Support: barry@barrymichaeldoyle.com.

## Known limits at submission

- **Eight languages** (D200): the screen, alerts, companion, help, game page and server messages follow the player's language, as Desk Crawler's do.
- Creator Fund eligibility is unconfirmed, as it was for Desk Crawler; budgeted at zero payouts.
