// Data only, with no runtime imports: the home route's head reads faqJsonLd, and anything that head imports ships in
// the site's main bundle on every page.
import type { Locale } from '@trmnl-games/platform'

type Faq = ReadonlyArray<{ q: string; a: string }>

/** The questions a visitor asks before installing, shared by the page and its FAQPage structured data (D169: per language). */
export const FAQ: Readonly<Record<Locale, Faq>> = {
  en: [
    { q: 'Do I need a TRMNL?', a: 'Yes. Desk Crawler draws its screen on a TRMNL e-ink display. The companion website manages your hero; it does not replace the screen.' },
    { q: 'Is it free?', a: 'Yes, with nothing to buy in the game. You can sponsor the project on GitHub if you like, and that changes nothing in play.' },
    { q: 'How do I start?', a: 'Install Desk Crawler from the TRMNL marketplace, sign in here to name your hero and connect it, then click Save in TRMNL. The first adventure shows up within 15 minutes.' },
    { q: 'Does my screen need to be on?', a: 'No. The game world moves every 15 minutes on our servers. Sleep Mode, slow refresh rates and other playlist items never cost your hero any progress.' },
    { q: 'Which layouts does it support?', a: 'Full screen and every mashup size, in landscape or portrait.' },
    { q: 'How often do I need to open the companion?', a: 'Every few days is plenty. Your hero keeps going until its bag fills up, so most visits are about sorting gear and choosing where to go next.' },
  ],
  fr: [
    { q: 'Faut-il un TRMNL ?', a: 'Oui. Desk Crawler affiche son écran sur un écran e-ink TRMNL. Le site compagnon gère votre héros ; il ne remplace pas l’écran.' },
    { q: 'Est-ce gratuit ?', a: 'Oui, sans rien à acheter dans le jeu. Vous pouvez soutenir le projet sur GitHub si vous le souhaitez, et cela ne change rien au jeu.' },
    { q: 'Comment commencer ?', a: 'Installez Desk Crawler depuis la boutique TRMNL, connectez-vous ici pour nommer votre héros et le relier, puis cliquez sur Enregistrer dans TRMNL. La première aventure apparaît en moins de 15 minutes.' },
    { q: 'Mon écran doit-il rester allumé ?', a: 'Non. Le monde du jeu avance toutes les 15 minutes sur nos serveurs. Le mode veille, un rafraîchissement lent ou les autres éléments de la playlist ne coûtent jamais de progression à votre héros.' },
    { q: 'Quelles mises en page sont prises en charge ?', a: 'Le plein écran et toutes les tailles de mashup, en paysage ou en portrait.' },
    { q: 'À quelle fréquence faut-il ouvrir le compagnon ?', a: 'Tous les quelques jours suffit largement. Votre héros continue jusqu’à ce que son sac soit plein, donc la plupart des visites servent à trier l’équipement et à choisir où aller ensuite.' },
  ],
  de: [
    { q: 'Brauche ich ein TRMNL?', a: 'Ja. Desk Crawler zeichnet seinen Bildschirm auf ein TRMNL-E-Ink-Display. Die Begleit-Website verwaltet deinen Helden; sie ersetzt den Bildschirm nicht.' },
    { q: 'Ist es kostenlos?', a: 'Ja, und im Spiel gibt es nichts zu kaufen. Wenn du möchtest, kannst du das Projekt auf GitHub unterstützen; am Spiel ändert das nichts.' },
    { q: 'Wie fange ich an?', a: 'Installiere Desk Crawler aus dem TRMNL-Marktplatz, melde dich hier an, um deinen Helden zu benennen und zu verbinden, und klicke dann in TRMNL auf Speichern. Das erste Abenteuer erscheint innerhalb von 15 Minuten.' },
    { q: 'Muss mein Bildschirm an sein?', a: 'Nein. Die Spielwelt läuft alle 15 Minuten auf unseren Servern weiter. Schlafmodus, langsame Aktualisierung und andere Playlist-Einträge kosten deinen Helden nie Fortschritt.' },
    { q: 'Welche Layouts werden unterstützt?', a: 'Vollbild und jede Mashup-Größe, im Quer- oder Hochformat.' },
    { q: 'Wie oft muss ich die Begleit-App öffnen?', a: 'Alle paar Tage reicht völlig. Dein Held macht weiter, bis seine Tasche voll ist, also geht es bei den meisten Besuchen ums Sortieren der Ausrüstung und darum, wohin es als Nächstes geht.' },
  ],
}

/** schema.org FAQPage for the questions above, in the page's language. */
export const faqJsonLd = (locale: Locale) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ[locale].map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
})
