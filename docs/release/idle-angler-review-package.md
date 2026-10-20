# Idle Angler marketplace review package (draft)

**Status (2026-10-20): submitted for review and emailed; waiting on TRMNL.** Translated into all eight languages the site speaks (D200). Plugin 568 exists in TRMNL, private, with its icon and URLs; Desk Crawler's listing is approved and live, so the condition in [the S7 checklist](../idle-angler.md#s7-checklist-barry) ("after Desk Crawler is approved") holds. Submitting, the listing edits below, the video and the email are Barry's actions (or need his explicit go for each).

## Listing

| Field | Now in plugin 568 | Proposed |
| --- | --- | --- |
| Name | Idle Angler | Unchanged |
| Description (≤50) | A fishing game that plays itself on your TRMNL (46 characters, saved 2026-10-19) | Done |
| Icon | Saved ([`idle-angler-plugin-icon.png`](../assets/idle-angler-plugin-icon.png), 512×512) | Unchanged |
| Featured image | Regenerated 2026-10-20 at template v19 from setting 506054 (blob 19687629): night at the Millpond, "Barry the dev · Expert", 12 of 58 species, goal Fill ten orders, best 3.2 kg rainbow trout | Done. The fictional candidate from the `listing` preview state (content v6, template v19) is [`idle-angler-featured.png`](../assets/idle-angler-featured.png), also the game page's sample |
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

1. **Production on content v6**: done 2026-10-20 (v5 for D199's first-cast fish, then v6 for D204's water ranks).
2. **Listing**: description saved 2026-10-19 (the plugin form's Save button does not persist, a fetch POST of the form does). Featured image regenerated at template v19 on 2026-10-20.
3. **Idle Angler live on trmnlgames.com**: done 2026-10-20, before submitting, because a game in `preview` refuses a non-admin's TRMNL connect (`trmnl.ts`, GAME_UNAVAILABLE) and its help and companion answer not-found. The public can't install until TRMNL lists the plugin. The D201 launch list was skipped: it only shows in `preview`. On approval day, set the two dates on `idle-angler-launch-day` and merge it (sitemap, `PRIVACY_UPDATED`, What's new, Install on TRMNL), after checking its `trmnl.com/integrations/idle-angler` link resolves.
4. **Install video**: skipped. The connect flow is the one TRMNL approved for Desk Crawler; the email offers a video on request ([recording checklist](recording-checklist.md) if they ask).
5. **Submitted for Review** 2026-10-20 (My Plugins shows `in_review`). Barry sent the [email](../idle-angler-review-email.md) the same day.

## Reviewer access

- Install from the plugin page; sign up on the companion with any email (one-time code), Google or GitHub. No passwords to share and no bypass.
- Pick a public name, click Connect, then Save in TRMNL. The first cast lands a fish within 15 minutes.
- Companion: `https://trmnlgames.com/app/idle-angler`. A player who already has a TRMNL Games account (from Desk Crawler) signs in with it and plays both. Support: barry@barrymichaeldoyle.com.

## Known limits at submission

- **Eight languages** (D200): the screen, alerts, companion, help, game page and server messages follow the player's language, as Desk Crawler's do.
- Creator Fund eligibility is unconfirmed, as it was for Desk Crawler; budgeted at zero payouts.
