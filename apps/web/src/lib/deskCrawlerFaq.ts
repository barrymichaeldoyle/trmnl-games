// Data only, with no imports: the home route's head reads FAQ_JSON_LD, and anything that head imports ships in the
// site's main bundle on every page.

/** The questions a visitor asks before installing, shared by the page and its FAQPage structured data. */
export const FAQ: ReadonlyArray<{ q: string; a: string }> = [
  { q: 'Do I need a TRMNL?', a: 'Yes. Desk Crawler draws its screen on a TRMNL e-ink display. The companion website manages your hero; it does not replace the screen.' },
  { q: 'Is it free?', a: 'Yes, with nothing to buy in the game. You can sponsor the project on GitHub if you like, and that changes nothing in play.' },
  { q: 'How do I start?', a: 'Install Desk Crawler from the TRMNL marketplace, sign in here to name your hero and connect it, then click Save in TRMNL. The first adventure shows up within 15 minutes.' },
  { q: 'Does my screen need to be on?', a: 'No. The game world moves every 15 minutes on our servers. Sleep Mode, slow refresh rates and other playlist items never cost your hero any progress.' },
  { q: 'Which layouts does it support?', a: 'Full screen and every mashup size, in landscape or portrait.' },
  { q: 'How often do I need to open the companion?', a: 'Every few days is plenty. Your hero keeps going until its bag fills up, so most visits are about sorting gear and choosing where to go next.' },
]

/** schema.org FAQPage for the questions above. */
export const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
}
