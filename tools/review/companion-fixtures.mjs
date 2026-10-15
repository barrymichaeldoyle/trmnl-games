/**
 * The real companion (shell, Hero, Bag, Rankings, Settings) with fictional data, for phone-width checks. No backend is
 * contacted: queries come from tools/review/fixtures/companion.json plus the variations below, and every mutation
 * settles locally (failing after 1.2 s, or succeeding after 0.8 s with `?ok=1`).
 *
 *   node tools/review/companion-fixtures.mjs && pnpm exec vite --config .previews/submission-companion/vite.config.mjs
 *
 * Then open http://127.0.0.1:4197/app/desk-crawler (or /inventory, /log, /leaderboard, /settings, /achievements, /keepsakes, /trmnl). Query parameters:
 *   workbench=1 (D129, default: a few materials and the workbench card)   workbench=rich (every job affordable)   workbench=done (a +3 weapon)   workbench=0 (no workbench)   workbench=locked (D155: below level 4, the locked card)
 *   potions=1 (D131, default: three strengths, a combine affordable)   potions=short (two minors, no Scrap)   potions=one (healing only)   potions=0 (no strengths)
 *   floor=server_room (D132: the hero on another floor)   status=paused|sleeping|dead|travelling|resting   held=1 (held find, bag full)   hp=40 (HP percent)   slots=30 (gear count)   merchant=1
 *   choice=1 (pending decision)   effects=1   occasion=1 (D139: Halloween today)   recap=1 (a return tally)   keepsake=done   long=1 (long item names)
 *   achievements=1 (a veteran's achievement shelves over 41 heroes)   fresh=1 (an achievement ten minutes ago, so no hint)   quiet=1 (empty log, no achievements)   ok=1 (mutations succeed)   outcome=invalid_code|already_claimed|easter_egg (with ok=1: a keepsake claim's answer)   egg=1 (the hidden Easter Egg on the shelf)   raids=1 (desk raids on, with a record and raid log lines)   meetings=1 (D141: meetings on, the Coworkers card and meeting log lines)   meetings=none (meetings on, nobody met yet)   public=1 (hero page public)
 *   todo=1 (D112: the to-do list with a done task, an away task and the longest label, plus to-do log lines)   todo=used (the same, swap spent)
 *   career=1 (P35: the goal card, the Career page and the unlocks, plus career log lines)   career=new (level 1, everything locked)   career=done (the ladder finished)
 *   notes=1 (D133: /field-notes for a level-17 veteran with most notes open)   notes=new (a fresh hero, the Office's note only)
 *   roster=locked (P37: Warrior level 4, the Hero page's locked card)   roster=open (one hero, the Rogue ready to recruit)   roster=two (a parked Warrior, the Rogue current, switch spent)   roster=undo (the same, inside the ten-minute undo)
 *   alerts=on (P33: two devices, both kinds on)   alerts=gone (turned off because the last device went stale)   alerts=none (no VAPID key yet)
 *   whatsnew=1 (D154: the What's new card, with every entry after 12 October)
 *   rank=9 (D152: the hero ninth on every board, so the rankings open with the rows around it)
 *   /desk-crawler/heroes/<name> serves the public hero page (private=1 reads as not found)
 * Idle Angler (D115): /app/idle-angler, /cooler, /shop, /logbook, /settings, with ia=full (cooler full), ia=empty (empty cooler, no bait here),
 *   ia=paused, ia=pending, ia=none (not started), ia=rich (Master Angler at the pier with every pass)
 *   goal=ready (D166, with v2=1: two reached goals waiting on the Dock's Claim button and a dot on the Dock tab)
 *   v2=1 (D162: content v2's goal, slate, season, run, charter and wall; /app/idle-angler/trophies) pegs=full (D167: no free peg, so no Mount)   v2=new (a first-day angler with everything locked)
 * Paper Lives (D159): /app/paper-lives, /people, /work, /settings with pl=adult (default: a decision open) | child | first (age 0, rename) | infant | senior (the will)
 *   | paused | memorial (ended, heirs) | long (worst-case names) | pending | none; /profile/<alias>/lives/1 serves a public life page. Fixtures come
 *   from the real backend: PL_FIXTURES=1 npx vitest run tests/convex/paper-lives-fixtures.test.ts
 *   year=early (content v3: a year not ready yet, Queue Age up)   year=queued (the same, queued)
 *   photos=done (L6: this week's photo taken)   photos=none (no photos, no TRMNL connected)   alerts=on also turns on Paper Lives' three kinds
 * The dev deployment's scene art is used when apps/web/.env.local sets VITE_CONVEX_SITE_URL.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
const root = resolve(import.meta.dirname, '../..')
const directory = resolve(root, '.previews/submission-companion')
mkdirSync(directory, { recursive: true })
const write = (name, body) => writeFileSync(resolve(directory, name), body)
write('index.html', '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Desk Crawler synthetic QA</title></head><body><div id="root"></div><script type="module" src="/main.jsx"></script></body></html>')
write('styles.css', readFileSync(resolve(root, 'apps/web/src/styles.css'), 'utf8').replace('@import "tailwindcss";', '@import "tailwindcss";\n@source "../../apps/web/src";'))
write('fixture.json', readFileSync(resolve(import.meta.dirname, 'fixtures/companion.json'), 'utf8'))
write('paper-lives.json', readFileSync(resolve(import.meta.dirname, 'fixtures/paper-lives.json'), 'utf8'))

// A pathname router with the handful of router APIs the companion uses.
write('router.jsx', `import React, { useSyncExternalStore, createContext, useContext } from 'react';
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); window.addEventListener('popstate', notify); return () => { listeners.delete(l); window.removeEventListener('popstate', notify) } };
const snapshot = () => location.pathname + location.search + location.hash;
export const useLocation = (options) => { const key = useSyncExternalStore(subscribe, snapshot, snapshot); const loc = { pathname: location.pathname, search: location.search, hash: location.hash, href: key }; return options?.select ? options.select(loc) : loc };
export const createFileRoute = () => (options) => ({ options, useParams: () => { const parts = location.pathname.replace(/\\/$/, '').split('/'); return parts[3] === 'lives' ? { alias: decodeURIComponent(parts[2]), n: parts[4] } : { alias: decodeURIComponent(parts.pop()) } } });
export const createRootRouteWithContext = () => (options) => ({ options });
export const notFound = () => new Error('not found');
export const redirect = () => new Error('redirect');
export const useRouter = () => ({ invalidate: async () => {} });
export const useNavigate = () => (to) => { history.pushState(null, '', typeof to === 'string' ? to : to.to); notify() };
const same = (a, b) => a.replace(/\\/$/, '') === b.replace(/\\/$/, '');
export const Link = ({ to, hash, activeOptions, preload, children, className, onClick, ...props }) => {
  const here = useLocation({ select: (l) => l.pathname });
  const href = location.search ? to + location.search + (hash ? '#' + hash : '') : to + (hash ? '#' + hash : '');
  const current = activeOptions?.exact ? same(here, to) : here.startsWith(to);
  return <a href={href} className={className} aria-current={current ? 'page' : undefined} {...props} onClick={(event) => { onClick?.(event); if (event.defaultPrevented || event.metaKey || event.ctrlKey) return; event.preventDefault(); history.pushState(null, '', href); notify(); if (hash) document.getElementById(hash)?.scrollIntoView(); else window.scrollTo(0, 0) }}>{children}</a>;
};
export const OutletContext = createContext(null);
export const Outlet = () => { const Page = useContext(OutletContext); return Page ? <Page /> : null };
`)

// Queries from the fixture; mutations settle locally.
write('data.js', `import fixture from './fixture.json';
import paperLives from './paper-lives.json';
import { ACHIEVEMENTS } from '../../packages/desk-crawler/src/content/achievements';
import { contentV16 } from '../../packages/desk-crawler/src/content/v16';
import { loreView } from '../../packages/desk-crawler/src/sim/core/biomes';
import { useCallback, useState } from 'react';
const params = new URLSearchParams(location.search);
const flag = (name) => params.get(name) === '1';
/** Three photos of one life at different ages, the last with a pet of the longest name (L6). */
const plPhotos = () => [
  { name: 'Maud Okafor', age: 4, petName: null, takenAt: Date.now() - 20 * 864e5, portrait: { ...paperLives.adult.life.portrait, stage: 'child', extra: 'none', pet: null, frame: false } },
  { name: 'Maud Okafor', age: 23, petName: 'Biscuit', takenAt: Date.now() - 13 * 864e5, portrait: { ...paperLives.adult.life.portrait, stage: 'young', extra: 'none', frame: false } },
  { name: 'Maud Okafor', age: 34, petName: 'Sir Wigglesworth', takenAt: Date.now() - 6 * 864e5, portrait: { ...paperLives.adult.life.portrait, frame: false } },
]
const status = params.get('status');
const held = flag('held');
const many = Number(params.get('slots') || 0);
const long = flag('long');
const data = structuredClone(fixture);
const hero = data.hero, inventory = data.inventory;
if (status) hero.status = status;
if (held) { hero.status = 'sleeping'; hero.wakeAtTick = null }
if (hero.status === 'travelling') { hero.targetBiomeId = 'server_room'; hero.arriveAtTick = hero.world.currentTick + 1 }
if (hero.status === 'dead') { hero.hp = 0; hero.reviveAtTick = hero.world.currentTick + 3 }
if (hero.status === 'resting') hero.hp = Math.round(hero.maxHp * 0.4);
if (params.get('floor')) hero.biomeId = params.get('floor');
// A hero saved in TRMNL an hour ago, for the first-days playlist reminder.
if (flag('new')) { hero.activatedAt = Date.now() - 3600000; hero.screenServed = false }
if (params.get('hp')) hero.hp = Math.round(hero.maxHp * Number(params.get('hp')) / 100);
if (flag('choice')) hero.choice = { eventId: 'late_night', title: 'The boss asks for one more hour', prompt: 'The lights are dimming but the report is not done. Stay late for a bonus, or head home?', expiresAtTick: hero.world.currentTick + 4, ticksLeft: 4, defaultOptionId: 'home', options: [{ id: 'stay', label: 'Stay late', change: { gold: 50, hp: -6, potions: 0 } }, { id: 'home', label: 'Head home', change: { gold: 0, hp: 0, potions: 0 } }] };
if (flag('effects')) hero.effects = [{ id: 'coffee', name: 'Coffee rush', blurb: '+3 ATK', kind: 'boon', ticksLeft: 3 }, { id: 'papercut', name: 'Paper cut', blurb: '-2 DEF', kind: 'bane', ticksLeft: 1 }];
// D139: occasion=1 shows Halloween today (chip and dressed scene); otherwise the next occasion is 18 days off.
if (flag('occasion')) {
  hero.calendar = { today: { id: 'halloween', name: 'Halloween', effect: '+15% gold', daysLeft: 1 }, next: { id: 'diwali', name: 'Diwali', effect: '+15% XP', inDays: 8 } };
  hero.scenePath = hero.scenePath.replace('/v4/', '/v5/').replace('/day/', '/day/halloween/').replace('/night/', '/night/halloween/');
} else hero.calendar = { today: null, next: { id: 'halloween', name: 'Halloween', effect: '+15% gold', inDays: 18 } };
if (flag('merchant')) { hero.merchantTicksLeft = 3; inventory.merchant = { offers: [{ id: 'potions', name: 'Three potions', quantity: 3, price: 30 }, { id: 'bag', name: 'Messenger Bag', quantity: 1, price: 225, tierId: 'messenger_bag' }], expiresAtTick: hero.world.currentTick + 3, ticksLeft: 3, biomeId: hero.biomeId } }
if (flag('recap')) data.recap = { ...data.recap, baseline: { at: Date.now() - 36e5 * 26 }, xpGained: 212, levelsGained: 1, newEvents: 19, counters: { combatWins: 7, goldEarned: 43, itemsFound: 2, deaths: 1 } };
// P37: the roster. The Heroes page reads roster:mine; the Hero page reads hero.roster.
const rosterMode = params.get('roster');
const rogueRule = { id: 'rogue', name: 'Rogue', blurb: 'Works the corridors. Hits a bit harder and pockets more, but takes hits worse.', passive: { name: 'Light fingers', blurb: 'More gold from every fight and find, and an edge in desk raids, raiding or defending.' }, hpPct: 93, modifiers: { attackPct: 10, defensePct: -10, goldPct: 20 }, raidEdgePct: 5 };
const warriorRule = { id: 'warrior', name: 'Warrior', blurb: 'Holds the desk, with the most health and the steadiest fights.', passive: { name: 'Steady', blurb: 'Full health and defense, with no special trick.' }, hpPct: 100, modifiers: {}, raidEdgePct: 0 };
const two = rosterMode === 'two' || rosterMode === 'undo';
if (rosterMode === 'locked') hero.level = 4;
if (two) { hero.name = 'Vex'; hero.level = 3; hero.class = 'rogue'; hero.className = 'Rogue' } else { hero.class = 'warrior'; hero.className = 'Warrior' }
hero.roster = rosterMode ? { unlockLevel: 6, open: rosterMode !== 'locked', heroes: two ? 2 : 1, warriorLevel: rosterMode === 'locked' ? 4 : 9 } : null;
const warriorRow = { id: 'w1', name: two ? 'Pip' : hero.name, class: 'warrior', className: 'Warrior', level: rosterMode === 'locked' ? 4 : 9, status: 'exploring', hp: 172, maxHp: 196, gold: 1840, biome: 'Cafeteria Depths', current: !two, parkedFor: two ? 52 : null };
data.roster = rosterMode ? {
  available: true, open: rosterMode !== 'locked', unlockLevel: 6, warriorLevel: warriorRow.level,
  heroes: two ? [warriorRow, { id: 'r1', name: 'Vex', class: 'rogue', className: 'Rogue', level: 3, status: 'exploring', hp: 107, maxHp: 111, gold: 64, biome: 'Office Cubicles', current: true, parkedFor: null }] : [warriorRow],
  classes: [{ ...warriorRule, recruited: true }, { ...rogueRule, recruited: two }],
  canPark: true, nextAt: two ? Date.now() + 36e5 * 21 : null, undoHeroId: rosterMode === 'undo' ? 'w1' : null, undoUntil: rosterMode === 'undo' ? Date.now() + 6e5 : null,
} : { available: false, open: false, unlockLevel: null, warriorLevel: null, heroes: [], classes: [], canPark: true, nextAt: null, undoHeroId: null, undoUntil: null };
data.keepsakes.easterEgg = params.get('egg') === '1'
if (params.get('keepsake') === 'done') { data.keepsakes.lastClaimWeek = 9999; data.keepsakes.nextAvailableAt = Date.now() + 86400000 * 3 }
// A veteran's shelves: most families started at varied tiers, one close to its next tier, and rarity over 41 heroes.
if (flag('achievements')) {
  const a = data.achievements, now = Date.now(), unlocked = [], counts = {};
  a.families.forEach((f, i) => {
    const reached = i % 7 === 6 ? 0 : Math.min(f.tiers, 1 + ((i * 3) % (f.tiers + 1)));
    const defs = ACHIEVEMENTS.filter((d) => d.family === f.family);
    defs.forEach((d) => { counts[d.id] = Math.max(1, Math.round(41 / (d.tier * d.tier + (i % 4)))) });
    if (reached === 0) { f.earned = null; f.tier = 0; f.next = { id: defs[0].id, tier: 1 }; f.value = 0; f.target = 1; return }
    const top = defs[reached - 1];
    defs.slice(0, reached).forEach((d, k) => unlocked.push({ id: d.id, unlockedAt: now - 86400000 * (i + 1) + k * 3600000 }));
    f.tier = reached; f.earned = { id: top.id, name: top.name, blurb: top.blurb, tier: reached, unlockedAt: now - 86400000 * (i + 1) + (reached - 1) * 3600000 };
    const next = defs[reached];
    f.next = next ? { id: next.id, tier: next.tier } : null; f.target = next ? (next.predicate.atLeast ?? 1) : 0; f.value = next ? Math.floor(f.target * ((i * 37) % 97) / 100) : 0;
  });
  counts[a.families[2].earned?.id] = 1;
  a.unlocked = unlocked; a.rarity = { counts, totalPlayers: 41, scoreAt: now - 1800000 };
}
if (flag('fresh') && data.achievements.unlocked.length) data.achievements.unlocked[0].unlockedAt = Date.now() - 600000; // an achievement ten minutes ago hides the hint (D127)
if (flag('quiet')) { data.log = []; data.achievements.families.forEach((f) => { f.earned = null }); data.achievements.unlocked = [] }
const raidsOn = flag('raids');
if (flag('whatsnew')) data.me.user.whatsNewSince = '2026-10-12';
// D152: move the hero down every board, swapping rows so the ranks stay in order.
if (params.get('rank')) for (const board of Object.values(data.leaderboard)) {
  const to = Number(params.get('rank')) - 1, from = board.own.rank - 1, scores = board.entries.map((row) => row.score);
  const [mine] = board.entries.splice(from, 1);
  board.entries.splice(to, 0, mine);
  board.entries.forEach((row, i) => { row.rank = i + 1; row.score = scores[i] });
  board.own = { ...board.own, rank: to + 1, score: scores[to] };
}
if (flag('public')) hero.publicProfile = true;
data.raids = { record: { launched: 0, won: 0, repelled: 0, lost: 0 }, raids: [] };
if (raidsOn) {
  hero.raidsEnabled = true;
  const pace = { cautious: [0.48, 60], balanced: [0.96, 50], bold: [1.92, 45] };
  hero.stances.forEach((s) => { s.raidsPerDay = pace[s.id][0]; s.raidWinPct = pace[s.id][1] });
  const now = Date.now();
  data.raids = { record: { launched: 9, won: 5, repelled: 4, lost: 3 }, raids: [
    { tick: 905, at: now - 9e5, role: 'target', rivalName: 'Quillfeather_Longname', profile: true, rival: true, won: false, gold: 14, hpLost: null, pending: true },
    { tick: 880, at: now - 36e5 * 7, role: 'raider', rivalName: 'Quill', profile: false, rival: true, won: true, gold: 14, hpLost: 9, pending: false },
    { tick: 860, at: now - 36e5 * 12, role: 'target', rivalName: 'Hidden player', won: true, gold: 6, hpLost: 3, pending: false },
    { tick: 790, at: now - 36e5 * 30, role: 'raider', rivalName: 'Mo', won: false, gold: 22, hpLost: 27, pending: false },
    { tick: 760, at: now - 36e5 * 40, role: 'target', rivalName: 'Bea', won: false, gold: 1240, hpLost: 30, pending: false },
  ] };
  data.log.unshift(
    { id: 'raid1', at: now - 6e5, tick: 906, kind: 'raid', summary: "Raided [[Quill]]'s desk while they were at lunch.", source: 'tick', deltas: { xpEarned: 0, gold: 14, hp: -9 } },
    { id: 'raid2', at: now - 9e5, tick: 905, kind: 'raid', summary: 'Came back to find [[Quillfeather_Longname]] had been through the drawers.', source: 'tick', deltas: { xpEarned: 0, gold: -1240, hp: -30 } },
    { id: 'raid3', at: now - 12e5, tick: 904, kind: 'death', summary: '[[Mo]] made off with the petty cash. Out cold for 2 hours. Lost 30 gold.', source: 'tick', deltas: { xpEarned: 0, gold: -52, hp: -18 } },
  );
}
// D141: the Coworkers card and meeting lines; meetings=none is the card before the first meeting.
data.meetings = { total: 0, meetings: [] };
if (flag('meetings') || params.get('meetings') === 'none') hero.meetingsEnabled = true;
if (flag('meetings')) {
  const now = Date.now();
  data.meetings = { total: 7, meetings: [
    { tick: 907, at: now - 3e5, role: 'partner', rivalName: 'Quillfeather_Longname', profile: true, rivalClass: 'rogue', kindId: 'coffee_run', biomeId: 'server_room', kindName: 'Coffee run', boon: 'Caffeinated', floor: 'Server Room', pending: false },
    { tick: 850, at: now - 36e5 * 14, role: 'starter', rivalName: 'Bea', rivalClass: 'warrior', kindId: 'shortcut', biomeId: 'server_room', kindName: 'Shortcut', boon: 'Shown the ropes', floor: 'Server Room', pending: true },
    { tick: 700, at: now - 36e5 * 50, role: 'starter', rivalName: 'Hidden player', rivalClass: 'warrior', kindId: 'office_gossip', biomeId: 'office_cubicles', kindName: 'Office gossip', boon: 'In the loop', floor: 'Office Cubicles', pending: false },
  ] };
  data.log.unshift(
    { id: 'meet1', at: now - 3e5, tick: 907, kind: 'meeting', summary: '[[Quillfeather_Longname]] dragged you out for a coffee. Caffeinated for 8 adventures.', source: 'tick', deltas: { xpEarned: 0, gold: 0, hp: 0, effectGained: 'caffeinated' } },
  );
}
if (long) inventory.gear.filter((g) => !g.equipped).slice(0, 2).forEach((g) => { g.label = 'Rare Microwave-Slaying ' + g.name + ' of the Cafeteria Depths'; g.rarity = 'rare' });
// D142: the day's name tag; nametag=sold shows it sold until tomorrow.
inventory.nameTag = { price: 200, inStockAt: params.get('nametag') === 'sold' ? Date.now() + 20 * 60 * 60 * 1000 : null };
// D129: the workbench. Every piece gets its salvage yield and next step; workbench=rich holds the materials and gold for every job,
// workbench=done shows a fully reinforced weapon, workbench=0 hides it (a catalog without one), workbench=locked is a hero below
// the D155 unlock: no salvage, no workbench and no combining, only the locked card.
const wbParam = params.get('workbench') ?? '1';
const wb = wbParam === 'locked' ? '0' : wbParam;
inventory.workbenchUnlockLevel = wbParam === 'locked' ? 4 : null;
const MATERIAL_OF = { common: 'scrap', uncommon: 'parts', rare: 'components', epic: 'components' };
const TIER_OF = { letter_opener: 1, ruler_blade: 1, cardigan: 1, lanyard_mail: 1, cable_cutter: 2, keyboard_mace: 2, insulated_cardigan: 2, anti_static_vest: 2, ladle_of_ruin: 3, spork_halberd: 3, apron_of_warding: 3, oven_mitt_plate: 3 };
const STEPS = [{ kind: 'tier', to: 2, label: 'Upgrade to Mk II', gold: 150, materials: { scrap: 6 } }, { kind: 'tier', to: 3, label: 'Upgrade to Mk III', gold: 500, materials: { scrap: 6, parts: 4 } }, { kind: 'reinforce', to: 1, label: 'Reinforce to +1', gold: 1000, materials: { scrap: 8, parts: 2 } }, { kind: 'reinforce', to: 2, label: 'Reinforce to +2', gold: 3000, materials: { scrap: 12, parts: 4, components: 1 } }, { kind: 'reinforce', to: 3, label: 'Reinforce to +3', gold: 8000, materials: { scrap: 16, parts: 6, components: 2 } }];
inventory.materials = wb === '0' ? [] : [{ id: 'scrap', name: 'Scrap', glyph: 'scrap', count: wb === 'rich' ? 60 : 7 }, { id: 'parts', name: 'Parts', glyph: 'parts', count: wb === 'rich' ? 20 : 1 }, { id: 'components', name: 'Components', glyph: 'components', count: wb === 'rich' ? 6 : 0 }];
inventory.workbench = wb === '0' ? null : { affix: { gold: 1500, materials: { components: 2 } }, affixes: [{ id: 'vampiric', name: 'Vampiric', blurb: 'Heals 5% of maximum HP after every win.' }, { id: 'lucky', name: 'Lucky', blurb: 'Adds 20% gold from wins and finds.' }, { id: 'sturdy', name: 'Sturdy', blurb: 'Takes 40% less damage from traps.' }, { id: 'thrifty', name: 'Thrifty', blurb: 'A retreat costs nothing and a knockout costs 5% of gold instead of 10%.' }] };
if (wb === 'rich') hero.gold = 24000;
// D131: potion strengths. potions=1 (default) holds all three with a combine affordable; potions=short holds two minors and no Scrap;
// potions=one holds healing potions only (the picker stays closed); potions=0 is a catalog without strengths.
const po = params.get('potions') ?? '1';
const heals = (pct) => Math.min(hero.maxHp, Math.ceil(hero.maxHp * pct / 100));
const rowsOf = (minor, healing, major) => [{ templateId: 'minor_potion', name: 'Minor Potion', healPct: 25, heals: heals(25), count: minor }, { templateId: 'healing_potion', name: 'Healing Potion', healPct: 40, heals: heals(40), count: healing }, { templateId: 'major_potion', name: 'Major Potion', healPct: 60, heals: heals(60), count: major }];
inventory.potionRows = po === '0' ? [{ templateId: 'healing_potion', name: 'Healing Potion', healPct: 40, heals: heals(40), count: inventory.potions }] : po === 'one' ? rowsOf(0, inventory.potions, 0) : po === 'short' ? rowsOf(2, 1, 0) : rowsOf(4, 2, 1);
inventory.potions = inventory.potionRows.reduce((sum, row) => sum + row.count, 0);
const scrap = (inventory.materials.find((m) => m.id === 'scrap') ?? { count: 0 }).count;
if (po === 'short') inventory.materials.forEach((m) => { if (m.id === 'scrap') m.count = 0 });
const minors = inventory.potionRows[0].count;
inventory.potionCombine = po === '0' || wbParam === 'locked' ? null : { from: { templateId: 'minor_potion', name: 'Minor Potion', count: 3, have: po === 'one' ? 0 : minors }, materials: { scrap: 1 }, to: { templateId: 'major_potion', name: 'Major Potion' }, shortfall: { potions: Math.max(0, 3 - (po === 'one' ? 0 : minors)), materials: po === 'short' || scrap < 1 ? { scrap: 1 } : {} }, batches: po === 'short' || po === 'one' ? 0 : Math.min(Math.floor(minors / 3), scrap) };
if (wb === 'done') { const w = inventory.gear.find((g) => g.equipped && g.kind === 'weapon'); if (w) { w.tier = 3; w.reinforced = 3; w.suffix = 'Mk III +3'; w.rarity = 'rare'; w.affix = { id: 'lucky', name: 'Lucky', blurb: 'Adds 20% gold from wins and finds.' }; w.label = 'Lucky Rare ' + w.name + ' Mk III +3' } }
const decorateGear = () => {
  const held = Object.fromEntries(inventory.materials.map((m) => [m.id, m.count]));
  inventory.gear.forEach((g) => {
    const tier = TIER_OF[g.templateId] ?? 1;
    g.salvage = wb === '0' ? {} : { [MATERIAL_OF[g.rarity]]: tier * (g.rarity === 'epic' ? 3 : 1) };
    g.suffix = g.suffix ?? ''; g.reinforced = g.reinforced ?? 0;
    g.affixable = wb !== '0' && (g.rarity === 'rare' || g.rarity === 'epic');
    if (wb === '0') { g.nextStep = null; return }
    const step = g.reinforced >= 3 ? null : STEPS.find((s) => (s.kind === 'tier' ? s.to === (g.tier ?? tier) + 1 : (g.tier ?? tier) === 3 && s.to === g.reinforced + 1)) ?? null;
    if (!step) { g.nextStep = null; return }
    const shortfall = Object.fromEntries(Object.entries(step.materials).filter(([id, n]) => (held[id] ?? 0) < n).map(([id, n]) => [id, n - (held[id] ?? 0)]));
    const requiredLevel = step.kind === 'tier' ? [1, 1, 4, 8][step.to] : g.requiredLevel;
    const from = g.kind === 'weapon' ? g.attack : g.defense;
    g.nextStep = { kind: step.kind, label: step.label, gold: step.gold, materials: step.materials, stat: { from, to: from + (step.kind === 'tier' ? 4 : 1) }, requiredLevel, shortfall, affordable: Object.keys(shortfall).length === 0 && hero.gold >= step.gold && requiredLevel <= hero.level };
  });
};
const templates = ['letter_opener', 'ruler_blade', 'cable_cutter', 'keyboard_mace', 'ladle_of_ruin', 'spork_halberd', 'cardigan', 'lanyard_mail', 'insulated_cardigan', 'anti_static_vest', 'apron_of_warding', 'oven_mitt_plate'];
if (many > 0) {
  const spare = inventory.gear.filter((g) => !g.equipped && !g.held);
  for (let i = spare.length; i < many; i++) { const t = templates[i % templates.length]; const kind = i % 12 < 6 ? 'weapon' : 'armor'; const rarity = ['common', 'uncommon', 'rare', 'epic'][i % 4]; inventory.gear.push({ id: 'f' + i, kind, templateId: t, name: t.replace(/_/g, ' '), label: (rarity === 'common' ? '' : rarity[0].toUpperCase() + rarity.slice(1) + ' ') + t.replace(/_/g, ' '), rarity, requiredLevel: i % 5 === 0 ? 12 : 1, attack: kind === 'weapon' ? 3 + (i % 9) : 0, defense: kind === 'armor' ? 2 + (i % 7) : 0, saleValue: 5 + i, affix: i % 3 === 0 ? { name: 'Vampiric', blurb: 'Heals a little on every hit.' } : null, equipped: false, held: false }) }
  inventory.capacity = Math.max(inventory.capacity, many); inventory.used = many;
}
if (held) { inventory.gear.unshift({ id: 'held', kind: 'weapon', templateId: 'spork_halberd', name: 'Spork Halberd', label: 'Rare Spork Halberd', rarity: 'rare', requiredLevel: 4, attack: 11, defense: 0, saleValue: 19, affix: null, equipped: false, held: true }); inventory.heldItemId = 'held'; inventory.used = inventory.capacity; inventory.canResume = false }
decorateGear();
// P35: career=1 gives the hero its place on the ladder (goal card, Career page, unlocks) and the two log lines; career=new a
// level-1 hero with everything still locked; career=done a finished ladder.
if (params.has('career')) {
  const mode = params.get('career');
  const rungs = contentV16.career.rungs.filter((r) => !r.retired);
  const rung = mode === 'new' ? 1 : mode === 'done' ? rungs.length : 9;
  const now = Date.now();
  hero.level = mode === 'new' ? 1 : hero.level;
  hero.career = { rung, total: rungs.length, current: rung < rungs.length ? { id: rungs[rung].id, title: rungs[rung].title, blurb: rungs[rung].blurb, gold: rungs[rung].gold, companion: rungs[rung].companion ?? false, value: rungs[rung].predicate.kind === 'counter' && rungs[rung].predicate.counter === 'choicesMade' ? 0 : 1, target: 1 } : null,
    rungs: rungs.map((r, i) => ({ id: r.id, title: r.title, blurb: r.blurb, gold: r.gold, companion: r.companion ?? false, state: i < rung ? 'done' : i === rung ? 'current' : 'ahead', reachedAt: i < rung && i >= 4 ? now - 864e5 * (rung - i) : null })) };
  hero.career.unclaimed = mode === 'new' ? [] : [{ id: 'first_trip', title: 'Travel to the Server Room', gold: 25, at: now - 864e5 * 2 }, { id: 'laptop_backpack', title: 'Buy the Laptop Backpack', gold: 30, at: now - 864e5 }];
  if (mode === 'new') hero.career.current = { ...hero.career.current, value: 0, target: 1 };
  if (mode !== 'new' && mode !== 'done') hero.career.current.value = 2, hero.career.current.target = 3, hero.career.current.title = 'Finish three to-do tasks', hero.career.current.blurb = rungs[3].blurb, hero.career.current.companion = false;
  hero.unlocks = [['todo', 'the to-do list', 2], ['stances', 'stances', 7], ['choices', 'office decisions', 5], ['merchant', 'the wandering merchant', 6], ['raids', 'desk raids', 7]].map(([feature, label, level]) => ({ feature, label, level, unlocked: hero.level >= level }));
  if (mode === 'new') { hero.todo = null; hero.stance = 'balanced' }
  data.log.unshift(
    { id: 'career1', at: now - 5e5, tick: 911, kind: 'career', summary: 'Goal reached: Sell a piece of gear. Next: Reach level 4.', source: 'tick', deltas: { xpEarned: 0, gold: 20, hp: 0 } },
    { id: 'career2', at: now - 36e5 * 5, tick: 896, kind: 'career', summary: 'Unlocked: stances.', source: 'tick', deltas: { xpEarned: 0, gold: 0, hp: 0 } },
  );
}
// D133: the five floors from the catalog, and the field notes. notes=1 is a level-17 veteran in the Parking Garage with most
// notes open; notes=new a fresh hero with only the Office's; otherwise the notes follow the fixture hero's wins.
if (params.get('notes') === '1') {
  hero.level = 17; hero.biomeId = 'parking_garage';
  hero.counters = { ...hero.counters, monsterWins: { paper_imp: 212, rogue_roomba: 180, stapler_mimic: 150, dust_daemon: 171, cable_serpent: 96, overheated_rack: 80, firewall_gremlin: 77, legacy_mainframe: 71, coffee_slime: 140, crumb_golem: 121, microwave_wraith: 118, leftovers_hydra: 99, box_file_beetle: 31, shelf_lurker: 25, microfilm_phantom: 1, trolley_swarm: 2 }, biomesVisited: { server_room: 4, cafeteria_depths: 3, archive: 2, parking_garage: 1 } };
}
if (params.get('notes') === 'new') { hero.level = 1; hero.biomeId = 'office_cubicles'; hero.counters = { ...hero.counters, monsterWins: {}, biomesVisited: undefined } }
hero.biomes = contentV16.biomes.map((b) => ({ id: b.id, name: b.name, unlockLevel: b.unlockLevel, unlocked: b.unlockLevel <= hero.level, safe: b.safe }));
hero.lore = loreView(contentV16, { biomeId: hero.biomeId, counters: { monsterWins: hero.counters.monsterWins ?? {}, biomesVisited: hero.counters.biomesVisited } });
// D112: todo=1 gives the hero a to-do list with each state the card draws; todo=used spends the swap.
if (params.has('todo')) {
  hero.todo = { swapAvailable: params.get('todo') !== 'used', nextStandupAt: Date.now() + 36e5 * 14, refillHour: 7, tasks: [
    { slot: 0, templateId: 'defeat_monster', label: 'Defeat 3 [[Legacy Mainframes]]', progress: 1, target: 3, reward: 16, done: false, biomeId: 'server_room', local: false },
    { slot: 1, templateId: 'find_gear', label: 'Find 2 pieces of gear', progress: 2, target: 2, reward: 5, done: true, biomeId: null, local: true },
    { slot: 2, templateId: 'explore_biome', label: 'Explore the [[Office Cubicles]] for 40 adventures', progress: 27, target: 40, reward: 5, done: false, biomeId: 'office_cubicles', local: true },
  ] };
  data.log.unshift(
    { id: 'todo1', at: Date.now() - 6e5, tick: 910, kind: 'todo', summary: 'Ticked off: Find 2 pieces of gear.', source: 'tick', deltas: { xpEarned: 0, gold: 5, hp: 0 } },
    { id: 'todo2', at: Date.now() - 36e5 * 3, tick: 899, kind: 'todo', summary: 'Stand-up: Defeat 3 [[Legacy Mainframes]]. Find 2 pieces of gear.', source: 'tick', deltas: { xpEarned: 0, gold: 0, hp: 0 } },
  );
}
// D115: Idle Angler's dock, logbook and preview from a fictional angler, varied by ?ia=.
const ia = params.get('ia');
const now = Date.now();
const bait = (cls, name, units, tub, price) => ({ class: cls, name, units, tubSize: tub, price, tubsThatFit: Math.max(0, Math.floor((72 - units) / tub)) });
const iaCatches = [['barbel', 'Barbel', 1900, 96], ['chub', 'Chub', 410, 41], ['dace', 'Dace', 230, 22], ['gudgeon', 'Gudgeon', 60, 18], ['chub', 'Chub', 1240, 53], ['grayling', 'Grayling', 820, 72], ['brown_trout', 'Brown Trout', 1500, 103]];
const iaDock = ia === 'none' ? { gameState: null, angler: null } : {
  gameState: 'active',
  angler: { alias: 'Barry', activationState: ia === 'pending' ? 'pending_trmnl' : 'active', status: ia === 'paused' ? 'paused' : 'fishing', title: ia === 'rich' ? 'Master Angler' : 'Local', nextTitle: ia === 'rich' ? null : { name: 'Old Hand', species: 14 }, gold: ia === 'rich' ? 18450 : 1240, waterId: ia === 'rich' ? 'harbour_pier' : 'river_bend', travelTo: null,
    rod: { tier: ia === 'rich' ? 4 : 2, name: ia === 'rich' ? 'Beachcaster' : 'Fibreglass Rod', limitGrams: ia === 'rich' ? 30000 : 4000 },
    cooler: { tier: 3, name: 'Chest Cooler', capacity: 18, used: ia === 'full' ? 18 : ia === 'empty' ? 0 : 7 },
    baitOnHook: ia === 'rich' ? 'strip' : 'maggots',
    bait: [bait('worms', 'Worms', 12, 12, 25), bait('bread', 'Bread', 0, 12, 20), bait('maggots', 'Maggots', ia === 'empty' ? 0 : 34, 12, 30), bait('spinner', 'Spinner', 0, 72, 240), bait('ragworm', 'Ragworm', 24, 12, 60), bait('strip', 'Mackerel strip', ia === 'rich' ? 48 : 0, 12, 75)],
    access: ia === 'rich' ? ['waders', 'pier_permit'] : ['waders'], counters: {}, publicProfile: false, speciesLogged: ia === 'rich' ? 26 : 10, speciesTotal: 30 },
  catches: ia === 'empty' ? [] : Array.from({ length: ia === 'full' ? 18 : 7 }, (_, i) => { const [speciesId, name, grams, value] = iaCatches[i % iaCatches.length]; return { id: 'c' + i, speciesId, name, grams: grams + i * 10, value, caughtTick: 900 - i, record: i === 0 } }),
  waters: [
    { id: 'millpond', name: 'Millpond', opensAfter: null, access: null, open: true, weather: 'clear', band: 'dusk', bitePercent: 17, baits: ['worms', 'bread', 'spinner'], weatherUntil: now + 36e5 * 2 },
    { id: 'river_bend', name: 'River Bend', opensAfter: { waterId: 'millpond', waterName: 'Millpond', species: 6, logged: 7 }, access: 'waders', open: true, weather: 'overcast', band: 'dusk', bitePercent: 21, baits: ['worms', 'maggots', 'spinner'], weatherUntil: now + 36e5 * 2 },
    { id: 'harbour_pier', name: 'Harbour Pier', opensAfter: { waterId: 'river_bend', waterName: 'River Bend', species: 5, logged: ia === 'rich' ? 9 : 3 }, access: 'pier_permit', open: ia === 'rich', weather: 'fog', band: 'dusk', bitePercent: 18, baits: ['ragworm', 'strip', 'spinner'], weatherUntil: now + 36e5 * 2 },
  ],
  shop: { rod: ia === 'rich' ? null : { name: 'Carbon Rod', price: 700, limitGrams: 10000, biteBonusPercent: 10 }, cooler: { name: 'Dockside Crate', price: 1500, capacity: 24 }, access: [{ id: 'waders', name: 'Waders', price: 250, water: 'river_bend', owned: true }, { id: 'pier_permit', name: 'Pier Permit', price: 900, water: 'harbour_pier', owned: ia === 'rich' }] },
  logs: [['A 1.9 kg Barbel took the maggots at dusk. A new personal best.', 96], ['A kingfisher flashes past, low and blue.', 0], ['A 410 g Chub took the maggots in the day.', 41], ['Something heavy took the maggots and kept going.', 0], ['Sold 6 fish for 312 gold.', 0]].map(([summary], i) => ({ id: 'l' + i, at: now - i * 36e5, kind: 'catch', summary, gold: 0 })),
  recap: ia === 'empty' ? { landed: 0, released: 0, records: 0, firsts: 0, best: null, gotAway: 0, awayGrams: [] } : { landed: 9, released: ia === 'full' ? 3 : 0, records: 1, firsts: 1, best: { speciesId: 'barbel', grams: 1900 }, gotAway: 2, awayGrams: [5200, 11800] },
  nextTickAt: now + 6e5,
};
if (ia === 'empty' && iaDock.angler) iaDock.angler.baitOnHook = 'maggots';
// D162: content v2's Dock block, three more waters and actions on the cooler's fish.
const v2 = params.get('v2');
if (v2 && iaDock.angler) {
  const fresh = v2 === 'new';
  iaDock.waters.push(
    { id: 'heron_lake', name: 'Heron Lake', opensAfter: { waterId: 'river_bend', waterName: 'River Bend', species: 6, logged: fresh ? 0 : 6 }, access: 'rowing_boat', open: !fresh, weather: 'clear', band: 'dusk', bitePercent: 16, baits: ['worms', 'maggots', 'bread', 'boilies', 'spinner', 'deadbait'], weatherUntil: now + 36e5 * 2 },
    { id: 'deep_sea', name: 'Deep-sea charter', opensAfter: { waterId: 'harbour_pier', waterName: 'Harbour Pier', species: 6, logged: fresh ? 0 : 6 }, access: null, open: false, charter: true, weather: 'wind', band: 'dusk', bitePercent: 15, baits: ['ragworm', 'strip', 'spinner', 'deadbait'], weatherUntil: now + 36e5 * 2 },
    { id: 'frozen_tarn', name: 'Frozen Tarn', opensAfter: { waterId: 'heron_lake', waterName: 'Heron Lake', species: 5, logged: fresh ? 0 : 5 }, access: 'ice_auger', open: false, closed: !fresh, weather: 'clear', band: 'dusk', bitePercent: 11, baits: ['maggots', 'worms', 'spinner', 'deadbait'], weatherUntil: now + 36e5 * 2 },
  );
  iaDock.shop.access.push({ id: 'rowing_boat', name: 'Rowing Boat', price: 1200, water: 'heron_lake', owned: !fresh }, { id: 'ice_auger', name: 'Ice Auger', price: 3500, water: 'frozen_tarn', owned: false });
  iaDock.angler.bait.push(bait('boilies', 'Boilies', 24, 12, 45), bait('deadbait', 'Deadbait', 6, 3, 0));
  const ids = iaDock.catches.map((c) => c.id);
  iaDock.full = {
    goal: { ...(fresh ? { line: 'Land your first fish', coins: 10, page: null, rung: 0, of: 26 } : { line: 'Mount a fish on the wall', coins: 30, page: 'cooler', rung: 13, of: 26 }), ...(params.get('goal') === 'ready' ? { unclaimed: [{ id: 'first_order', title: 'Fill an order for the fishmonger', coins: 20 }, { id: 'ten_species', title: 'Log ten species', coins: 30 }] } : {}) },
    comingUp: fresh ? { feature: 'shop_upgrades', name: 'Rod and cooler upgrades', species: 2, logged: 0 } : { feature: 'deadbait', name: 'Deadbait', species: 10, logged: 9 },
    features: { shop_upgrades: !fresh, orders: !fresh, opens: !fresh, trophies: !fresh, deadbait: !fresh },
    orders: fresh ? [] : [
      { id: 'o1', kind: 'species', line: 'Two Chub', hint: null, count: 2, catchIds: [ids[1], ids[4]], reward: 161, bonus: 20 },
      { id: 'o2', kind: 'teaching', line: 'One Tench', hint: 'Millpond, on bread or worms, at dawn or dusk', count: 1, catchIds: [], reward: null, bonus: 60 },
      { id: 'o3', kind: 'time', line: 'Two fish caught at dawn or dusk', hint: null, count: 2, catchIds: [], reward: null, bonus: 30 },
    ],
    swappedToday: params.get('swapped') === '1',
    season: { id: 'autumn', name: 'Autumn', endsAt: now + 864e5 * 3 },
    runs: fresh ? [] : [{ id: 'salmon_run', line: 'The salmon are running at River Bend.', water: 'river_bend', species: 'Salmon' }],
    charter: { price: 550, casts: 96, castsLeft: 0 },
    pegs: { pegs: 6, free: params.get('pegs') === 'full' ? 0 : 3, next: { pegs: 12, price: 800 } },
    deadbait: 6,
    catchActions: Object.fromEntries(iaDock.catches.map((c, i) => [c.id, { bait: !fresh && i % 3 === 2, mountCost: !fresh && i === 0 ? 192 : null }])),
  };
}
const species = (water, list) => ({ water, species: list.map(([id, name, rarity, count, best, max, baits, times, weather]) => count ? { id, seen: true, name, rarity, count, bestGrams: best, maxGrams: max, baits, times, weather } : { id, seen: false, rarity, baits: rarity === 'epic' ? null : baits ?? null }) });
const iaBook = [
  species({ id: 'millpond', name: 'Millpond' }, [['minnow', 'Minnow', 'common', 12, 48, 50, ['worms', 'bread'], null, null], ['roach', 'Roach', 'common', 30, 590, 600, ['worms', 'bread'], null, null], ['perch', 'Perch', 'common', 9, 1210, 1400, ['worms', 'spinner'], null, null], ['bream', 'Bream', 'uncommon', 3, 2200, 3500, ['bread', 'worms'], ['dawn', 'dusk', 'night'], null], ['eel', 'Eel', 'rare', 0, 0, 0, ['worms']], ['golden_carp', 'Golden Carp', 'epic', 0]]),
  species({ id: 'river_bend', name: 'River Bend' }, [['chub', 'Chub', 'common', 22, 2100, 2500, ['worms', 'maggots'], null, null], ['grayling', 'Grayling', 'uncommon', 4, 1100, 1500, ['maggots'], null, ['overcast', 'rain']], ['pike', 'Pike', 'rare', 0, 0, 0, ['spinner']], ['salmon', 'Salmon', 'epic', 0]]),
];
const queries = {
  'users:me': () => data.me,
  'platform:list': () => ({ admin: true, games: [{ slug: 'desk-crawler', status: 'live', canOpen: true }, { slug: 'idle-angler', status: params.get('status') === 'live' ? 'live' : 'hidden', canOpen: true }, { slug: 'paper-lives', status: 'hidden', canOpen: true }] }),
  'paperLives/lives:view': () => {
    if (params.get('pl') === 'none') return { gameState: null, life: null }
    const view = paperLives[params.get('pl') ?? 'adult'] ?? paperLives.adult
    // year=early: an hour into the year, not ready; year=queued: the same with Age up queued.
    const early = params.get('year') === 'early' || params.get('year') === 'queued'
    return early && view.year ? { ...view, year: { ...view.year, elapsed: 3, ageUpRequested: params.get('year') === 'queued', minimumAt: Date.now() + 75 * 60_000, closesAt: Date.now() + 7 * 3600_000 } } : view
  },
  'paperLives/payload:preview': () => null,
  'paperLives/album:view': () => (params.get('album') === '0' ? { ...paperLives.album, lives: [], tree: [], following: [] } : { ...paperLives.album, lives: paperLives.album.lives.map((life, i) => ({ ...life, photos: i === 0 ? plPhotos().slice(0, 2) : [] })), following: [{ alias: 'Quillfeather_Longname', name: 'Ottilie Achterberg', age: 52, job: 'Museum director', status: 'living' }, { alias: 'Mo', name: 'Sid Rook', age: 81, job: null, status: 'ended' }] }),
  'paperLives/achievements:mine': () => paperLives.achievements,
  'paperLives/photos:mine': () => ({ totalCollected: params.get('photos') === 'none' ? 0 : 3, claimedThisWeek: params.get('photos') === 'done', nextAvailableAt: Date.now() + 3 * 864e5, connected: params.get('photos') !== 'none', living: (params.get('pl') ?? 'adult') !== 'memorial', photos: params.get('photos') === 'none' ? [] : plPhotos() }),
  'paperLives/album:board': (args = {}) => ({ ...(args.board === 'fortune' ? paperLives.boardFortuneAll : paperLives.boardLongestWeek), board: args.board ?? 'longest', period: args.period ?? 'week', entries: [['Quillfeather_Longname', 'Ottilie Achterberg-Cartwright', 101], ['Barry', 'Maud Okafor', 100], ['Mo', 'Sid Rook', 94], ['Hidden player', '', 91], ['Bea', 'Ada Moss', 88]].map(([name, life, age], i) => ({ rank: i + 1, name, life, value: args.board === 'fortune' ? 400000 - i * 50000 : age, age, own: name === 'Barry', profile: name === 'Mo' })), own: { rank: 2, value: 100, age: 100 } }),
  'paperLives/public:lifePage': () => (params.get('private') === '1' ? null : { alias: 'Barry', ordinal: 1, name: 'Maud Okafor', age: 101, generation: 'Third of the Okafors', traits: ['Curious', 'Loyal'], epitaph: paperLives.memorial.memorial.epitaph, highlights: paperLives.memorial.logs.filter((l) => l.kind !== 'recap').slice(0, 8).map((l) => l.age + ': ' + l.summary), endedAt: Date.now() - 864e5, portrait: paperLives.memorial.life.portrait, photos: plPhotos(), parent: { ordinal: 0, name: 'Hamish Okafor' }, child: null }),
  'idleAngler/anglers:dock': () => iaDock,
  'idleAngler/anglers:logbook': () => iaBook,
  'idleAngler/payload:preview': () => ({ scene_base: '' }),
  'idleAngler/full:trophies': () => ({ pegs: 6, rosettes: 4, wall: [['tench', 'Tench', 2600, 'Millpond', 0], ['barbel', 'Barbel', 5200, 'River Bend', 1], ['mirror_carp', 'Mirror Carp', 12400, 'Heron Lake', 2]].map(([speciesId, name, grams, water, peg]) => ({ id: 't' + peg, speciesId, name, grams, water, at: now - 864e5 * (peg + 1), peg, place: null, period: null })), medals: [{ id: 'm1', speciesId: 'chub', name: 'Chub', grams: 2100, water: 'River Bend', at: now - 864e5 * 2, peg: null, place: 1, period: 'o2026-10-17' }, { id: 'm2', speciesId: 'perch', name: 'Perch', grams: 640, water: 'Millpond', at: now - 864e5 * 9, peg: null, place: 3, period: 'o2026-10-10' }] }),
  'idleAngler/full:opens': () => (params.get('v2') ? { period: 'o2026-10-24', startsAt: now - 36e5 * 5, endsAt: now + 864e5, on: true, prizes: [500, 300, 150], waters: [['millpond', 'Millpond', 'perch', 'Perch'], ['river_bend', 'River Bend', 'chub', 'Chub'], ['heron_lake', 'Heron Lake', 'mirror_carp', 'Mirror Carp']].map(([id, name, tid, tname], w) => ({ id, name, target: { id: tid, name: tname }, own: w === 1 ? { rank: 4, speciesId: tid, grams: 1300 } : null, entries: w === 2 ? [] : [['Quillfeather_Longname', 2400], ['Mo', 1900], ['Bea', 1500], ['Barry', 1300]].map(([n, g], i) => ({ rank: i + 1, name: n, speciesId: tid, grams: g, own: n === 'Barry', profile: false })) })) } : null),
  'idleAngler/flies:mine': () => ({ totalCollected: 5, claimedThisWeek: params.get('fly') === 'done', nextAvailableAt: now + 864e5 * 3, connected: true, newest: 'red_tag', box: ['black_gnat', 'royal_coachman', 'mayfly', 'woolly_bugger', 'red_tag', 'blue_dun', 'march_brown', 'zulu', 'silver_doctor', 'greenwell', 'hares_ear', 'golden_olive'].map((id, i) => ({ id, name: id.replace(/_/g, ' '), count: i < 5 ? 1 : 0, rows: ['   #   ', '  ###  ', ' #:::# ', '  ###  ', ' # # # ', '   #   ', '  ##   '] })) }),
  'idleAngler/leaderboard:view': (args = {}) => ({ waterId: args.waterId ?? 'river_bend', period: args.period ?? 'week', weekEndsAt: now + 864e5 * 2, full: false, own: { rank: 3, speciesId: 'barbel', grams: 1900 }, entries: [['Quillfeather_Longname', 'pike', 5240], ['Mo', 'chub', 2410], ['Barry', 'barbel', 1900], ['Hidden player', 'grayling', 1210], ['Bea', 'dace', 380]].map(([name, speciesId, grams], i) => ({ rank: i + 1, name, speciesId, grams, own: name === 'Barry', profile: name === 'Mo' })) }),
  'idleAngler/achievements:mine': () => ({ earnedCount: 23, rarity: { counts: { catches_3: 12, logbook_2: 7, got_away_1: 30 }, totalPlayers: 41 }, families: [
    { family: 'catches', name: 'Catches', category: 'Fishing', tiers: 5, earned: { id: 'catches_3', name: 'Regular on the Bank', blurb: 'A hundred fish from the bank.', tier: 3 }, next: { id: 'catches_4', name: 'Old Hand', tier: 4 }, value: 412, target: 1000 },
    { family: 'got_away', name: 'Got away', category: 'Fishing', tiers: 3, earned: { id: 'got_away_1', name: 'The One That Got Away', blurb: 'The line went slack.', tier: 1 }, next: { id: 'got_away_2', name: 'Snapped Again', tier: 2 }, value: 7, target: 10 },
    { family: 'epic_catches', name: 'Epic catches', category: 'Fishing', tiers: 2, earned: null, next: { id: 'epic_catches_1', name: 'Once in a Season', tier: 1 }, value: 0, target: 1 },
    { family: 'logbook', name: 'Logbook', category: 'Logbook', tiers: 4, earned: { id: 'logbook_2', name: 'Naturalist', blurb: 'You know a rudd from a roach.', tier: 2 }, next: { id: 'logbook_3', name: 'Field Guide', tier: 3 }, value: 14, target: 20 },
    { family: 'rods', name: 'Rods', category: 'Progress', tiers: 3, earned: { id: 'rods_3', name: 'Beachcaster', blurb: 'Built for the biggest fish in the sea.', tier: 3 }, next: null, value: 4, target: 4 },
    { family: 'sales', name: 'Sales', category: 'Trade', tiers: 4, earned: { id: 'sales_2', name: 'Regular Supplier', blurb: 'They know your cooler.', tier: 2 }, next: { id: 'sales_3', name: 'Wholesale', tier: 3 }, value: 182, target: 250 },
    { family: 'species_roach', name: 'Roach', category: 'Species', tiers: 2, earned: { id: 'specimen_roach', name: 'Specimen Roach', blurb: '', tier: 2 }, next: null, value: 590, target: 450 },
    { family: 'species_chub', name: 'Chub', category: 'Species', tiers: 2, earned: { id: 'first_chub', name: 'First Chub', blurb: '', tier: 1 }, next: { id: 'specimen_chub', name: 'Specimen Chub', tier: 2 }, value: 2100, target: 1875 },
    { family: 'species_salmon', name: 'Salmon', category: 'Species', tiers: 2, earned: null, next: { id: 'first_salmon', name: 'First Salmon', tier: 1 }, value: 0, target: 1 },
  ] }),
  'heroes:mine': () => hero,
  'roster:mine': () => data.roster,
  'inventory:mine': () => inventory,
  'heroes:returnSummary': () => data.recap,
  'achievements:mine': () => data.achievements,
  'keepsakes:mine': () => data.keepsakes,
  'connections:mine': () => data.connections,
  // P33: off with no device by default; alerts=on lists two devices with both kinds on, alerts=gone shows the stale-device note.
  'alerts:mine': () => ({ vapidPublicKey: params.get('alerts') === 'none' ? null : 'BFixtureVapidKey', timezone: 'Europe/Dublin', asleep: params.get('alerts') === 'on', merchant: params.get('alerts') === 'on', majorDecision: params.get('alerts') === 'on', lifeEnded: params.get('alerts') === 'on', newArrival: params.get('alerts') === 'on', quietStart: 21, quietEnd: 8, offReason: params.get('alerts') === 'gone' ? 'no_devices' : null, devices: params.get('alerts') === 'on' ? [{ id: 'd1', label: 'Chrome on Android', createdAt: Date.now() - 864e5, fingerprint: 'aaaa' }, { id: 'd2', label: 'Safari on iPhone', createdAt: Date.now() - 36e5, fingerprint: 'bbbb' }] : [] }),
  'leaderboard:view': (args) => { const board = data.leaderboard[args.board ?? 'recent_7d']; return args.cohortKey && args.cohortKey !== board.cohortKey ? { ...board, cohortKey: args.cohortKey, own: null, entries: board.entries.slice(0, 6), totalPlayers: 6 } : board },
  'heroes:recentLog': (args) => ({ page: data.log.slice(0, args.paginationOpts.numItems), isDone: true, continueCursor: '' }),
  'trmnlPayload:mine': () => undefined,
  'raids:recent': () => data.raids,
  'meetings:recent': () => data.meetings,
  // D143: follows=1 lists four followed players (a rival, a public hero, a hidden page, a renamed player); follow=following|rival|full sets the hero page's button.
  'follows:list': () => flag('follows') ? { limit: 20, own: { level: hero.level, rank: 9 }, follows: [
    { id: 'f1', rival: true, state: 'public', name: 'Quillfeather_Longname', hero: { name: 'Sir Staplesworth the Unbending', heroClass: 'rogue', level: hero.level + 2, status: 'exploring', biome: 'Parking Garage', rank: 4 }, raids: { won: 3, lost: 1 } },
    { id: 'f2', rival: false, state: 'public', name: 'Mo', hero: { name: 'Biscuit', heroClass: 'warrior', level: 3, status: 'resting', biome: 'Break Room', rank: 27 }, raids: { won: 0, lost: 0 } },
    { id: 'f3', rival: false, state: 'private', name: 'Bea', hero: null, raids: { won: 0, lost: 0 } },
    { id: 'f4', rival: false, state: 'gone', name: 'Hidden player', hero: null, raids: { won: 0, lost: 0 } },
  ], rivalOf: [{ name: 'Quillfeather_Longname', public: true, followed: true }, { name: 'Mo', public: true, followed: true }, { name: 'Zed', public: false, followed: false }], rivalOfMore: false } : { limit: 20, own: { level: hero.level, rank: 9 }, follows: [], rivalOf: params.get('follows') === 'named' ? [{ name: 'Mo', public: true, followed: false }] : [], rivalOfMore: false },
  'follows:status': () => params.get('follow') === 'none' ? null : { followId: ['following', 'rival'].includes(params.get('follow')) ? 'f1' : null, rival: params.get('follow') === 'rival', full: params.get('follow') === 'full' },
  // The public hero page (D109) from the same fictional hero; raids=1 adds a raid record, private=1 reads as not found.
  'profiles:view': (args) => flag('private') ? null : { alias: args.alias, heroName: hero.name, heroClass: 'warrior', level: hero.level, status: hero.status, biome: 'Server Room', scenePath: hero.scenePath, adventuringSince: Date.now() - 86400000 * 12, rank: { rank: 3, totalPlayers: 41 }, lifetime: { combatWins: hero.counters.combatWins, itemsFound: hero.counters.itemsFound, trips: hero.counters.trips ?? 4, rescues: hero.counters.rescues, epicFinds: hero.counters.epicFinds ?? 1 }, raids: raidsOn ? { won: 5, failed: 4, repelled: 4, lost: 3 } : { won: 0, failed: 0, repelled: 0, lost: 0 }, achievements: data.achievements.families.filter((f) => f.earned).slice(0, 4).map((f) => ({ id: f.earned.id, tier: f.earned.tier, name: f.earned.name, blurb: f.earned.blurb, family: f.name })), rarity: null, achievementCount: data.achievements.unlocked.length },
};
if (raidsOn) data.leaderboard.recent_24h?.entries?.forEach((row, i) => { row.profile = i % 2 === 0 });
// A nested path proxy: api.users.me reads 'users:me' and api.idleAngler.anglers.dock reads 'idleAngler/anglers:dock'.
const path = (parts) => new Proxy(function () {}, { get: (_, key) => (key === Symbol.toPrimitive || key === 'toString' ? () => parts.slice(0, -1).join('/') + ':' + parts.at(-1) : path([...parts, key])) });
export const api = path([]);
export const convexQuery = (fn, args = {}) => ({ queryKey: ['convexQuery', String(fn), args] });
export const keepPreviousData = (previous) => previous;
export const useQuery = (options) => { const [, fn, args] = options.queryKey; const data = queries[fn] ? queries[fn](args) : undefined; return { data, isPending: false, isPlaceholderData: false, isError: false, refetch: async () => ({ data }) } };
const settle = () => new Promise((resolveIt, reject) => setTimeout(() => (flag('ok') ? resolveIt({ changed: true, outcome: params.get('outcome') ?? 'collected', totalCollected: 1 }) : reject(new Error('Synthetic QA: all server mutations are disabled'))), flag('ok') ? 800 : 1200));
// Optimistic updates are not simulated: the stubbed mutation ignores them, so only local drafts show early.
export const useMutation = () => useCallback(Object.assign(async () => settle(), { withOptimisticUpdate() { return this } }), []);
export const useAction = () => useCallback(async () => settle(), []);
export const useConvexAuth = () => ({ isLoading: false, isAuthenticated: true });
export const usePaginatedQuery = (fn, args, { initialNumItems }) => { const [count, setCount] = useState(initialNumItems); const page = data.log.slice(0, count); return { results: page, status: page.length < data.log.length ? 'CanLoadMore' : 'Exhausted', loadMore: (n) => setCount((c) => c + n) } };
export const getFunctionName = (fn) => String(fn);
export class ConvexError extends Error { constructor(data) { super(typeof data === 'string' ? data : data?.message); this.data = data } }
export const paginationOptsValidator = {};
`)
write('clerk.jsx', `import React from 'react';
export const Show = ({ when, children }) => (when === 'signed-in' ? <>{children}</> : null);
export const SignInButton = ({ children }) => <>{children}</>;
export const SignUpButton = ({ children }) => <>{children}</>;
export const UserButton = () => <span className="inline-block size-7 rounded-full bg-raised" aria-hidden="true" />;
export const useAuth = () => ({ isLoaded: true, isSignedIn: true });
export const useUser = () => ({ user: null, isLoaded: true });
export const useClerk = () => ({ signOut: async () => {} });
`)
write('analytics.js', 'export const captureAnalytics = () => {}; export const captureAnalyticsException = () => {}; export const analyticsConfigured = () => false; export const openAnalyticsPreferences = () => {};')
write('analyticsProvider.jsx', 'export const useAnalyticsView = () => {}; export const AnalyticsProvider = () => null;')
write('switchAccount.jsx', `import React from 'react'; export const SwitchAccount = () => <p className="text-sm text-muted">Signed in. <button type="button" className="font-semibold text-muted underline underline-offset-4">Switch account</button></p>;`)

write('main.jsx', `import React from 'react';
import { createRoot } from 'react-dom/client';
import { Route as Shell } from '../../apps/web/src/routes/app/desk-crawler';
import { Route as Hero } from '../../apps/web/src/routes/app/desk-crawler/index';
import { Route as Bag } from '../../apps/web/src/routes/app/desk-crawler/inventory';
import { Route as Ranks } from '../../apps/web/src/routes/app/desk-crawler/leaderboard';
import { Route as Settings } from '../../apps/web/src/routes/app/desk-crawler/settings';
import { Route as Log } from '../../apps/web/src/routes/app/desk-crawler/log';
import { Route as DcAchievements } from '../../apps/web/src/routes/app/desk-crawler/achievements';
import { Route as Career } from '../../apps/web/src/routes/app/desk-crawler/career';
import { Route as FieldNotes } from '../../apps/web/src/routes/app/desk-crawler/field-notes';
import { Route as Roster } from '../../apps/web/src/routes/app/desk-crawler/roster';
import { Route as Keepsakes } from '../../apps/web/src/routes/app/desk-crawler/keepsakes';
import { Route as Device } from '../../apps/web/src/routes/app/desk-crawler/trmnl';
import { Route as Profile } from '../../apps/web/src/routes/desk-crawler/heroes.$alias';
import { Route as IaShell } from '../../apps/web/src/routes/app/idle-angler';
import { Route as IaDock } from '../../apps/web/src/routes/app/idle-angler/index';
import { Route as IaCooler } from '../../apps/web/src/routes/app/idle-angler/cooler';
import { Route as IaShop } from '../../apps/web/src/routes/app/idle-angler/shop';
import { Route as IaLogbook } from '../../apps/web/src/routes/app/idle-angler/logbook';
import { Route as IaSettings } from '../../apps/web/src/routes/app/idle-angler/settings';
import { Route as IaRankings } from '../../apps/web/src/routes/app/idle-angler/rankings';
import { Route as IaAchievements } from '../../apps/web/src/routes/app/idle-angler/achievements';
import { Route as IaTrophies } from '../../apps/web/src/routes/app/idle-angler/trophies';
import { Route as PlShell } from '../../apps/web/src/routes/app/paper-lives';
import { Route as PlLife } from '../../apps/web/src/routes/app/paper-lives/index';
import { Route as PlPeople } from '../../apps/web/src/routes/app/paper-lives/people';
import { Route as PlWork } from '../../apps/web/src/routes/app/paper-lives/work';
import { Route as PlSettings } from '../../apps/web/src/routes/app/paper-lives/settings';
import { Route as PlAlbum } from '../../apps/web/src/routes/app/paper-lives/album';
import { Route as PlRankings } from '../../apps/web/src/routes/app/paper-lives/rankings';
import { Route as PlAchievements } from '../../apps/web/src/routes/app/paper-lives/achievements';
import { Route as PlPublic } from '../../apps/web/src/routes/profile/$alias_.lives.$n';
import { AuthShell } from '../../apps/web/src/lib/platformShell';
import { NetworkProvider } from '../../apps/web/src/lib/network';
import { OutletContext, useLocation } from './router.jsx';
import './styles.css';
const pages = { '/app/desk-crawler': Hero.options.component, '/app/desk-crawler/inventory': Bag.options.component, '/app/desk-crawler/leaderboard': Ranks.options.component, '/app/desk-crawler/settings': Settings.options.component, '/app/desk-crawler/log': Log.options.component, '/app/desk-crawler/achievements': DcAchievements.options.component, '/app/desk-crawler/career': Career.options.component, '/app/desk-crawler/field-notes': FieldNotes.options.component, '/app/desk-crawler/roster': Roster.options.component, '/app/desk-crawler/keepsakes': Keepsakes.options.component, '/app/desk-crawler/trmnl': Device.options.component,
  '/app/idle-angler': IaDock.options.component, '/app/idle-angler/cooler': IaCooler.options.component, '/app/idle-angler/shop': IaShop.options.component, '/app/idle-angler/logbook': IaLogbook.options.component, '/app/idle-angler/settings': IaSettings.options.component, '/app/idle-angler/rankings': IaRankings.options.component, '/app/idle-angler/achievements': IaAchievements.options.component, '/app/idle-angler/trophies': IaTrophies.options.component,
  '/app/paper-lives': PlLife.options.component, '/app/paper-lives/people': PlPeople.options.component, '/app/paper-lives/work': PlWork.options.component, '/app/paper-lives/settings': PlSettings.options.component, '/app/paper-lives/album': PlAlbum.options.component, '/app/paper-lives/rankings': PlRankings.options.component, '/app/paper-lives/achievements': PlAchievements.options.component };
const lifePage = /^\\/profile\\/[^/]+\\/lives\\/\\d+/.test(location.pathname);
const publicPage = location.pathname.startsWith('/desk-crawler/heroes/') || lifePage;
if (!publicPage && !pages[location.pathname.replace(/\\/$/, '')]) history.replaceState(null, '', '/app/desk-crawler' + location.search);
function App() {
  const pathname = useLocation({ select: (l) => l.pathname.replace(/\\/$/, '') });
  const AppShell = (pathname.startsWith('/app/idle-angler') ? IaShell : pathname.startsWith('/app/paper-lives') ? PlShell : Shell).options.component;
  return <OutletContext.Provider value={pages[pathname] ?? pages['/app/desk-crawler']}><AuthShell><AppShell /></AuthShell></OutletContext.Provider>;
}
document.body.className = 'bg-ground text-ink';
const ProfilePage = (lifePage ? PlPublic : Profile).options.component;
createRoot(document.getElementById('root')).render(<NetworkProvider>{publicPage ? <ProfilePage /> : <App />}</NetworkProvider>);
`)
write('vite.config.mjs', `import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '../..');
const here = (name) => resolve(import.meta.dirname, name);
const env = loadEnv('development', resolve(root, 'apps/web'), 'VITE_');
export default defineConfig({
  root: import.meta.dirname, publicDir: resolve(root, 'apps/web/public'), appType: 'spa', plugins: [react(), tailwind()],
  define: { 'import.meta.env.VITE_CONVEX_SITE_URL': JSON.stringify(env.VITE_CONVEX_SITE_URL ?? '') },
  resolve: { alias: [
    { find: '@tanstack/react-router', replacement: here('router.jsx') },
    { find: '@clerk/tanstack-react-start', replacement: here('clerk.jsx') },
    { find: /^(@convex-dev\\/react-query|@tanstack\\/react-query|convex\\/react|convex\\/server|convex\\/values|@trmnl-games\\/backend\\/api)$/, replacement: here('data.js') },
    { find: /^.*lib\\/analytics$/, replacement: here('analytics.js') },
    { find: /^.*lib\\/analyticsProvider$/, replacement: here('analyticsProvider.jsx') },
    { find: /^.*lib\\/switchAccount$/, replacement: here('switchAccount.jsx') },
  ] },
  server: { host: '0.0.0.0', port: 4197, strictPort: true, fs: { allow: [root] } },
});
`)
console.log('Prepared .previews/submission-companion. Start with pnpm exec vite --config .previews/submission-companion/vite.config.mjs')
