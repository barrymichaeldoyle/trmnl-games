import { contentTranslator, type ContentTranslator } from '@trmnl-games/desk-crawler/i18n'
import { defineMessages } from '../lib/i18n'

const fr = contentTranslator('fr')
const de = contentTranslator('de')

type Band = 'common' | 'uncommon' | 'rare' | 'legendary'
type Shelf = 'Lifetime' | 'Set piece' | 'Decisions' | 'Raids' | 'Coworkers' | 'Office calendar'
type HintLink = 'bag' | 'hero' | 'keepsakes' | 'map'

/** A shelf's title: a floor's monster shelf is the floor, the others are named in the catalog. */
export function shelfTitle(category: string, t: { shelves: Record<Shelf, string> }, c: ContentTranslator): string {
  if (category.endsWith(' monster')) return c.name(category.slice(0, -' monster'.length))
  return (t.shelves as Record<string, string>)[category] ?? c.text(category)
}

/**
 * D169: the Achievements page and its daily hint. Achievement, family and floor names come from the content
 * dictionaries; the shelves that are not floors are named here.
 */
export const dcAchievementsMessages = defineMessages({
  en: {
    title: 'Achievements',
    bands: { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', legendary: 'Legendary' } as Record<Band, string>,
    ofHeroes: (count: number, total: number) => `${count} of ${total} ${total === 1 ? 'hero' : 'heroes'}`,
    percentOfHeroes: (pct: string) => `${pct}% of heroes`,
    rarityLater: 'Rarity after the next hourly update',
    shelves: { 'Lifetime': 'Lifetime', 'Set piece': 'Set pieces', 'Decisions': 'Decisions', 'Raids': 'Raids', 'Coworkers': 'Coworkers', 'Office calendar': 'Office calendar' } as Record<Shelf, string>,
    tierOf: (name: string, tier: number, tiers: number) => `${name}, tier ${tier} of ${tiers}`,
    notEarned: 'Not earned yet',
    notYet: 'Not yet',
    achievement: 'Achievement',
    tierOfShort: (tier: number, tiers: number) => ` · Tier ${tier} of ${tiers}`,
    earned: 'Earned ',
    tier: (label: string) => `Tier ${label}`,
    topTier: 'Top tier reached.',
    close: 'Close',
    closest: 'Closest',
    rarest: 'Rarest',
    latest: 'Latest',
    forTier: (value: string, target: string, label: string) => `${value} of ${target} for tier ${label}`,
    found: 'Found',
    tiersEarned: (n: number, of: number) => `${n} of ${of} tiers earned`,
    firstOne: 'The first adventure earns the first one.',
    rarityNote: 'Rarity is the share of ranked heroes holding each one, as of the last hourly update.',
    shelfCount: (n: number, of: number) => `${n} of ${of}`,

    hint: 'Hint',
    hintMerchant: 'Buy something from the merchant visiting your hero.',
    hintChoice: 'Answer the decision waiting for your hero.',
    hintKeepsake: "Enter this week's keepsake code from your TRMNL.",
    hintSell: 'Sell a piece of spare gear from your bag.',
    hintBag: (bag: string, price: string) => `Buy the ${bag} for ${price} gold.`,
    hintFloor: (floor: string) => `Travel to the ${floor} to meet monsters your hero has not beaten yet.`,
    hintTrip: 'Send your hero to another floor from the world map.',
    hintStance: 'Try a different stance for your hero.',
    links: { bag: 'Open Bag', hero: 'Open Hero', keepsakes: 'Open Desk keepsakes', map: 'Open the world map' } as Record<HintLink, string>,
    fillsSlot: (shelf: string) => `Fills a "?" slot on the ${shelf} shelf.`,
    familyTier: (family: string, label: string, value: string, target: string) => `${family} tier ${label}: ${value} of ${target}`,
  },
  fr: {
    title: 'Succès',
    bands: { common: 'Commun', uncommon: 'Peu commun', rare: 'Rare', legendary: 'Légendaire' },
    ofHeroes: (count: number, total: number) => `${count} sur ${total} héros`,
    percentOfHeroes: (pct: string) => `${pct} % des héros`,
    rarityLater: 'Rareté après la prochaine mise à jour horaire',
    shelves: { 'Lifetime': 'Carrière entière', 'Set piece': 'Moments forts', 'Decisions': 'Décisions', 'Raids': 'Raids', 'Coworkers': 'Collègues', 'Office calendar': 'Calendrier du bureau' },
    tierOf: (name: string, tier: number, tiers: number) => `${name}, palier ${tier} sur ${tiers}`,
    notEarned: 'Pas encore obtenu',
    notYet: 'Pas encore',
    achievement: 'Succès',
    tierOfShort: (tier: number, tiers: number) => ` · Palier ${tier} sur ${tiers}`,
    earned: 'Obtenu le ',
    tier: (label: string) => `Palier ${label}`,
    topTier: 'Palier maximal atteint.',
    close: 'Fermer',
    closest: 'Le plus proche',
    rarest: 'Le plus rare',
    latest: 'Le dernier',
    forTier: (value: string, target: string, label: string) => `${value} sur ${target} pour le palier ${label}`,
    found: 'Trouvés',
    tiersEarned: (n: number, of: number) => `${n} paliers obtenus sur ${of}`,
    firstOne: 'La première aventure rapporte le premier.',
    rarityNote: 'La rareté est la part des héros classés qui possèdent chacun, à la dernière mise à jour horaire.',
    shelfCount: (n: number, of: number) => `${n} sur ${of}`,

    hint: 'Astuce',
    hintMerchant: 'Achetez quelque chose au marchand qui rend visite à votre héros.',
    hintChoice: 'Répondez à la décision qui attend votre héros.',
    hintKeepsake: 'Saisissez le code souvenir de la semaine affiché sur votre TRMNL.',
    hintSell: 'Vendez une pièce d’équipement en trop de votre sac.',
    hintBag: (bag: string, price: string) => `Achetez ${fr.nameWith(bag, 'le')} pour ${price} pièces d’or.`,
    hintFloor: (floor: string) => `Partez pour ${fr.nameWith(floor, 'le')} affronter des monstres que votre héros n’a pas encore battus.`,
    hintTrip: 'Envoyez votre héros à un autre étage depuis la carte du monde.',
    hintStance: 'Essayez une autre posture pour votre héros.',
    links: { bag: 'Ouvrir le Sac', hero: 'Ouvrir Héros', keepsakes: 'Ouvrir Souvenirs de bureau', map: 'Ouvrir la carte du monde' },
    fillsSlot: (shelf: string) => `Remplit une case « ? » de l’étagère ${shelf}.`,
    familyTier: (family: string, label: string, value: string, target: string) => `${family}, palier ${label} : ${value} sur ${target}`,
  },
  de: {
    title: 'Erfolge',
    bands: { common: 'Gewöhnlich', uncommon: 'Ungewöhnlich', rare: 'Selten', legendary: 'Legendär' },
    ofHeroes: (count: number, total: number) => `${count} von ${total} ${total === 1 ? 'Held' : 'Helden'}`,
    percentOfHeroes: (pct: string) => `${pct} % der Helden`,
    rarityLater: 'Seltenheit nach dem nächsten stündlichen Update',
    shelves: { 'Lifetime': 'Gesamte Laufbahn', 'Set piece': 'Glanzmomente', 'Decisions': 'Entscheidungen', 'Raids': 'Überfälle', 'Coworkers': 'Kollegen', 'Office calendar': 'Bürokalender' },
    tierOf: (name: string, tier: number, tiers: number) => `${name}, Grad ${tier} von ${tiers}`,
    notEarned: 'Noch nicht verdient',
    notYet: 'Noch nicht',
    achievement: 'Erfolg',
    tierOfShort: (tier: number, tiers: number) => ` · Grad ${tier} von ${tiers}`,
    earned: 'Verdient am ',
    tier: (label: string) => `Grad ${label}`,
    topTier: 'Höchster Grad erreicht.',
    close: 'Schließen',
    closest: 'Am nächsten',
    rarest: 'Am seltensten',
    latest: 'Zuletzt',
    forTier: (value: string, target: string, label: string) => `${value} von ${target} für Grad ${label}`,
    found: 'Gefunden',
    tiersEarned: (n: number, of: number) => `${n} von ${of} Graden verdient`,
    firstOne: 'Das erste Abenteuer bringt den ersten.',
    rarityNote: 'Seltenheit ist der Anteil der gewerteten Helden, die ihn haben, Stand letztes stündliches Update.',
    shelfCount: (n: number, of: number) => `${n} von ${of}`,

    hint: 'Tipp',
    hintMerchant: 'Kauf etwas beim Händler, der deinen Helden besucht.',
    hintChoice: 'Beantworte die Entscheidung, die auf deinen Helden wartet.',
    hintKeepsake: 'Gib den Andenken-Code dieser Woche von deinem TRMNL ein.',
    hintSell: 'Verkauf ein überzähliges Ausrüstungsteil aus deiner Tasche.',
    hintBag: (bag: string, price: string) => `Kauf ${de.nameWith(bag, 'den')} für ${price} Gold.`,
    hintFloor: (floor: string) => `Reise ${de.nameWith(floor, 'ins')}, um Monster zu treffen, die dein Held noch nicht besiegt hat.`,
    hintTrip: 'Schick deinen Helden über die Weltkarte auf ein anderes Stockwerk.',
    hintStance: 'Probier eine andere Haltung für deinen Helden.',
    links: { bag: 'Tasche öffnen', hero: 'Held öffnen', keepsakes: 'Schreibtisch-Andenken öffnen', map: 'Weltkarte öffnen' },
    fillsSlot: (shelf: string) => `Füllt ein „?“-Feld im Regal ${shelf}.`,
    familyTier: (family: string, label: string, value: string, target: string) => `${family}, Grad ${label}: ${value} von ${target}`,
  },
})
