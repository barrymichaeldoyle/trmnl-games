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
  es: [
    { q: '¿Necesito un TRMNL?', a: 'Sí. Desk Crawler dibuja su pantalla en una pantalla de tinta electrónica TRMNL. La web complementaria gestiona tu héroe; no sustituye a la pantalla.' },
    { q: '¿Es gratis?', a: 'Sí, y no hay nada que comprar en el juego. Si quieres, puedes apoyar el proyecto en GitHub, y eso no cambia nada en el juego.' },
    { q: '¿Cómo empiezo?', a: 'Instala Desk Crawler desde la tienda de TRMNL, inicia sesión aquí para ponerle nombre a tu héroe y conectarlo, y pulsa Guardar en TRMNL. La primera aventura aparece en menos de 15 minutos.' },
    { q: '¿Tiene que estar encendida mi pantalla?', a: 'No. El mundo del juego avanza cada 15 minutos en nuestros servidores. El modo reposo, las frecuencias de actualización lentas y los demás elementos de la lista de reproducción nunca le cuestan progreso a tu héroe.' },
    { q: '¿Qué diseños admite?', a: 'Pantalla completa y todos los tamaños de mashup, en horizontal o en vertical.' },
    { q: '¿Cada cuánto tengo que abrir la app?', a: 'Basta con entrar cada pocos días. Tu héroe sigue hasta que se le llena la bolsa, así que casi todas las visitas son para ordenar el equipo y elegir adónde ir después.' },
  ],
  it: [
    { q: 'Mi serve un TRMNL?', a: 'Sì. Desk Crawler disegna la sua schermata su un display e-ink TRMNL. Il sito di supporto gestisce il tuo eroe; non sostituisce lo schermo.' },
    { q: 'È gratis?', a: 'Sì, e nel gioco non c’è niente da comprare. Se vuoi puoi sostenere il progetto su GitHub, e questo non cambia nulla nel gioco.' },
    { q: 'Come comincio?', a: 'Installa Desk Crawler dal marketplace TRMNL, accedi qui per dare un nome al tuo eroe e collegarlo, poi premi Salva in TRMNL. La prima avventura arriva entro 15 minuti.' },
    { q: 'Lo schermo deve essere acceso?', a: 'No. Il mondo del gioco avanza ogni 15 minuti sui nostri server. La modalità sospensione, le frequenze di aggiornamento lente e gli altri elementi della playlist non fanno mai perdere progressi al tuo eroe.' },
    { q: 'Quali layout supporta?', a: 'Schermo intero e tutte le dimensioni di mashup, in orizzontale o in verticale.' },
    { q: 'Ogni quanto devo aprire l’app?', a: 'Ogni pochi giorni basta e avanza. Il tuo eroe va avanti finché la borsa non si riempie, quindi quasi tutte le visite servono a sistemare l’equipaggiamento e a scegliere dove andare.' },
  ],
  pt: [
    { q: 'Preciso de um TRMNL?', a: 'Sim. O Desk Crawler desenha a tela numa tela e-ink TRMNL. O site complementar gerencia seu herói; ele não substitui a tela.' },
    { q: 'É grátis?', a: 'Sim, e não há nada para comprar no jogo. Se quiser, você pode apoiar o projeto no GitHub, e isso não muda nada no jogo.' },
    { q: 'Como começo?', a: 'Instale o Desk Crawler pela loja do TRMNL, entre aqui para dar um nome ao seu herói e conectá-lo, e clique em Salvar no TRMNL. A primeira aventura aparece em até 15 minutos.' },
    { q: 'Minha tela precisa estar ligada?', a: 'Não. O mundo do jogo avança a cada 15 minutos nos nossos servidores. Modo de suspensão, taxas de atualização lentas e outros itens da playlist nunca custam progresso ao seu herói.' },
    { q: 'Quais layouts ele aceita?', a: 'Tela inteira e todos os tamanhos de mashup, em paisagem ou retrato.' },
    { q: 'Com que frequência preciso abrir o app?', a: 'A cada poucos dias já basta. Seu herói continua até a bolsa encher, então a maioria das visitas é para arrumar o equipamento e escolher para onde ir.' },
  ],
  pl: [
    { q: 'Czy potrzebuję TRMNL?', a: 'Tak. Desk Crawler rysuje swój ekran na wyświetlaczu e-ink TRMNL. Strona towarzysząca zarządza bohaterem; nie zastępuje ekranu.' },
    { q: 'Czy to za darmo?', a: 'Tak, i w grze nie ma nic do kupienia. Jeśli chcesz, możesz wesprzeć projekt na GitHubie, co niczego nie zmienia w grze.' },
    { q: 'Jak zacząć?', a: 'Zainstaluj Desk Crawler ze sklepu TRMNL, zaloguj się tutaj, nazwij bohatera i połącz go, a potem kliknij „Zapisz” w TRMNL. Pierwsza przygoda pojawi się w ciągu 15 minut.' },
    { q: 'Czy ekran musi być włączony?', a: 'Nie. Świat gry posuwa się co 15 minut na naszych serwerach. Tryb uśpienia, rzadkie odświeżanie i inne elementy playlisty nigdy nie zabierają bohaterowi postępów.' },
    { q: 'Jakie układy obsługuje?', a: 'Pełny ekran i każdy rozmiar mashupu, w poziomie lub w pionie.' },
    { q: 'Jak często muszę otwierać aplikację?', a: 'Co kilka dni w zupełności wystarczy. Bohater działa, dopóki torba się nie zapełni, więc większość wizyt to porządkowanie sprzętu i wybór, dokąd dalej.' },
  ],
  nl: [
    { q: 'Heb ik een TRMNL nodig?', a: 'Ja. Desk Crawler tekent zijn scherm op een TRMNL-e-ink-scherm. De begeleidende website beheert je held; hij vervangt het scherm niet.' },
    { q: 'Is het gratis?', a: 'Ja, en er valt in het spel niets te kopen. Je kunt het project op GitHub steunen als je wilt, en dat verandert niets aan het spel.' },
    { q: 'Hoe begin ik?', a: 'Installeer Desk Crawler vanuit de TRMNL-marketplace, log hier in om je held een naam te geven en te koppelen, en klik dan in TRMNL op Opslaan. Het eerste avontuur verschijnt binnen 15 minuten.' },
    { q: 'Moet mijn scherm aanstaan?', a: 'Nee. De spelwereld gaat elk kwartier verder op onze servers. Slaapstand, trage verversingssnelheden en andere afspeellijstitems kosten je held nooit voortgang.' },
    { q: 'Welke indelingen worden ondersteund?', a: 'Volledig scherm en elke mashupgrootte, liggend of staand.' },
    { q: 'Hoe vaak moet ik de app openen?', a: 'Om de paar dagen is ruim genoeg. Je held gaat door tot de tas vol is, dus de meeste bezoeken gaan over uitrusting sorteren en kiezen waar je heen gaat.' },
  ],
}

/** schema.org FAQPage for the questions above, in the page's language. */
export const faqJsonLd = (locale: Locale) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ[locale].map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
})
