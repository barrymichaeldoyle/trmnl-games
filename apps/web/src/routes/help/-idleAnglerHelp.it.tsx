import { anglerWords } from '@trmnl-games/idle-angler/i18n'
import { SUPPORT_EMAIL } from '../../lib/support'
import { IA_FACTS as F, type HelpPage } from './-idleAnglerHelp'

const w = anglerWords('it')
const n = (value: number) => w.number(value)
const e = (parts: readonly string[]) => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} e ${parts.at(-1)}`)

export const it: HelpPage = {
  seoTitle: 'Guida di Idle Angler',
  description: 'Come pesca Idle Angler sul tuo TRMNL: esche, frigo, canne, acque, stagioni, registro, Open del fine settimana e scatola delle mosche.',
  title: 'Idle Angler su TRMNL',
  contents: {
    'getting-started': 'Per iniziare',
    goals: 'Obiettivi e cosa si apre quando',
    'how-fishing-works': 'Come funziona la pesca',
    'time-and-weather': 'Orari, meteo e stagioni',
    bait: 'Esca e pesce morto',
    'the-fishmonger': 'Il pescivendolo',
    'the-cooler': 'Il frigo',
    'rods-and-fish-that-get-away': 'Canne e pesci che scappano',
    waters: 'Acque',
    'the-logbook': 'Il registro e i titoli',
    rankings: 'Classifiche e Open del fine settimana',
    'the-trophy-wall': 'La parete dei trofei',
    'the-fly-box': 'La scatola delle mosche',
    achievements: 'Traguardi',
    alerts: 'Avvisi',
    'pausing-and-removing': 'Pausa e rimozione',
    help: 'Aiuto',
  },
  Body: () => (
    <>
      <h2 id="getting-started">Per iniziare</h2>
      <ul>
        <li>Installa Idle Angler dal marketplace dei plugin TRMNL e scegli Installa.</li>
        <li>Accedi a TRMNL Games e collega l’installazione. Il tuo pescatore usa il tuo nome pubblico.</li>
        <li>Di nuovo in TRMNL, fai clic su Salva. Entro quindici minuti il tuo pescatore lancia per la prima volta e prende un pesce.</li>
        <li>Aggiungi il plugin a una playlist o a un mashup. Tutte e quattro le dimensioni del layout funzionano in entrambi gli orientamenti.</li>
      </ul>
      <h2 id="goals">Obiettivi e cosa si apre quando</h2>
      <p>Il Pontile mostra sempre un obiettivo, come «{w.goal('first_sale')}» o «{w.goal('dawn_dusk')}». Raggiungerlo mette da parte qualche moneta: tocca Riscuoti sul Pontile per prenderle, e compare l’obiettivo successivo. Un punto sulla scheda Pontile ti dice che ce n’è uno in attesa. Gli obiettivi non scadono mai, e il tuo pescatore ne raggiunge circa la metà senza di te.</p>
      <p>Il gioco si apre man mano che il registro si riempie: canne e frigo migliori a {F.unlocks.shop_upgrades} specie, ordini del pescivendolo a {F.unlocks.orders}, gli Open del fine settimana a {F.unlocks.opens}, la parete dei trofei a {F.unlocks.trophies} e il pesce morto a {F.unlocks.deadbait}. Il Pontile dice cosa arriva dopo.</p>
      <h2 id="how-fishing-works">Come funziona la pesca</h2>
      <p>Ogni quindici minuti, giorno e notte, il tuo pescatore lancia una volta. A volte un pesce abbocca. Quale dipende dall’acqua, dall’esca, dall’ora e dal meteo. Il suo peso decide il prezzo, se è un record personale e dove finisce in classifica. Il tuo TRMNL mostra la scena, le ultime storie e la classifica della settimana della tua acqua. Apri l’app per vendere le catture, comprare esca o cambiare acqua.</p>
      <h2 id="time-and-weather">Orari, meteo e stagioni</h2>
      <p>L’alba va dalle 05:00 alle 08:00, il giorno fino alle 17:00, il tramonto fino alle 20:00, poi è notte, nel fuso orario che indica il tuo TRMNL. I pesci abboccano di più all’alba e al tramonto. Il meteo è lo stesso per tutti i pescatori di un’acqua e cambia ogni sei ore: sereno, coperto, pioggia, vento o nebbia. Cielo coperto e pioggia portano più abboccate {w.waterName('river_bend').at}, il vento meno, e la nebbia rende alba e tramonto abbastanza scuri per i pesci notturni.</p>
      <p>Le acque hanno le loro stagioni, uguali per tutti: primavera, estate, autunno e inverno, una settimana ciascuna, con il cambio ogni lunedì alle 00:00 UTC. Alcuni pesci abboccano solo in una stagione, in acqua dolce d’inverno si rallenta, e la scena mostra fiori, foglie o neve. Ogni stagione ha una risalita, dal lunedì al giovedì, quando arriva una specie: {e(F.runs.map((id) => w.species(id).toLowerCase()))}.</p>
      <h2 id="bait">Esca e pesce morto</h2>
      <p>Ogni acqua ha le sue esche, e l’esca decide quali pesci possono abboccare; il Negozio dice quali pesci prendono ciascuna. Scegli l’esca nella pagina del Pontile. Ogni pesce che tieni, o che scappa, consuma un’esca. Un lancio senza abboccata non ne consuma, e nemmeno un pesce rilasciato perché il frigo è pieno. Senza esca per l’acqua, il pescatore pesca con l’amo nudo, che dà meno abboccate e solo pesci piccoli. Compra l’esca in barattoli nel Negozio, fino a {F.baitCap} per tipo; l’esca non si guasta mai.</p>
      <p>I pesci piccoli, come rutilo, leucisco, alborella e sgombro, possono tornare sull’amo come pesce morto dal frigo: un pesce dà {F.deadbaitPerFish} esche, fino a {F.deadbaitCap} di scorta. Solo i predatori prendono il pesce morto, come persico, luccio, lucioperca, anguilla e i grandi pesci di mare, e con quello vengono più pesanti.</p>
      <h2 id="the-fishmonger">Il pescivendolo</h2>
      <p>Il pescivendolo espone {F.orderSlots} ordini, come «{w.text('Two Roach')}» o «{w.text('One fish over 1.5 kg')}». Quando i pesci del tuo frigo corrispondono a un ordine, il pescivendolo compare nella pagina del Frigo con quei pesci e un pulsante Vendi: paga 1,5 volte il prezzo di mercato più un extra, e la pagina mostra entrambi i prezzi. Gli ordini non scadono mai, e un posto vuoto si riempie alle 07:00 della tua ora. Il tuo pescatore non sceglie le catture, quindi il pescivendolo si fa vedere solo quando c’è qualcosa da vendergli.</p>
      <h2 id="the-cooler">Il frigo</h2>
      <p>I pesci restano nel frigo finché non li vendi. Quando è pieno, il pescatore continua a pescare e rilascia quello che prende. I pesci rilasciati finiscono comunque nel registro, contano per i traguardi e possono guidare le classifiche, ma non danno monete. Il tuo TRMNL avvisa quando il frigo è pieno, e il suo codice QR apre il frigo. Un frigo più grande vuol dire meno pesci rilasciati tra una visita e l’altra. Il gioco non vende mai i pesci al posto tuo.</p>
      <h2 id="rods-and-fish-that-get-away">Canne e pesci che scappano</h2>
      <p>Ogni canna tira su pesci fino a un certo peso. Un pesce più pesante si libera, e la storia dice che qualcosa di pesante è scappato. Una canna migliore l’avrebbe preso. Le canne migliori danno anche qualche abboccata in più.</p>
      <h2 id="waters">Acque</h2>
      <ul>
        <li><strong>{w.water('millpond')}</strong>: dove iniziano tutti. Rutili, persici e abramidi, carpe all’alba e al tramonto, anguille di notte.</li>
        <li><strong>{w.water('river_bend')}</strong>: si apre quando hai {F.gates.river_bend} specie {w.waterName('millpond').of} nel registro, con gli {w.pass('waders').toLowerCase()}. Trote, cavedani e barbi, e i predatori, luccio e lucioperca, col cucchiaino.</li>
        <li><strong>{w.water('harbour_pier')}</strong>: si apre quando hai {F.gates.harbour_pier} specie {w.waterName('river_bend').of} nel registro, con il {w.pass('pier_permit')}. Pesci di mare, più grandi e di maggior valore. Quasi tutti richiedono la {w.rod('Carbon Rod')} o di meglio.</li>
        <li><strong>{w.water('heron_lake')}</strong>: si apre quando hai {F.gates.heron_lake} specie {w.waterName('river_bend').of} nel registro, con la {w.pass('rowing_boat').toLowerCase()}. Grandi carpe con le boilies e siluri nelle notti d’estate.</li>
        <li><strong>{w.water('deep_sea')}</strong>: si apre quando hai {F.gates.deep_sea} specie {w.waterName('harbour_pier').of} nel registro. Un biglietto del Negozio compra {F.charter.casts} lanci in mare per {n(F.charter.price)} monete; la barca ti riporta al molo quando finiscono, e i lanci non usati restano sul biglietto. I pesci più grandi richiedono la {w.rod('Boat Rod')}.</li>
        <li><strong>{w.water('frozen_tarn')}</strong>: si apre quando hai {F.gates.frozen_tarn} specie {w.waterName('heron_lake').of} nel registro, con la {w.pass('ice_auger').toLowerCase()}, e solo nella settimana d’inverno. Quando il ghiaccio si scioglie, il pescatore torna a piedi {w.waterName('heron_lake').at}.</li>
      </ul>
      <p>Spostarsi costa un lancio, poi il pescatore pesca nella nuova acqua. Se l’esca che usi non va bene lì, il pescatore passa all’esca adatta di cui hai di più. Puoi tornare indietro quando vuoi.</p>
      <h2 id="the-logbook">Il registro e i titoli</h2>
      <p>Ogni specie che prendi viene registrata con il numero e il tuo peso migliore, e il registro dice quale esca, orario e meteo preferisce. I pesci non ancora presi compaiono come sagome con la loro esca, tranne gli epici. I pesci epici richiedono esca, ora e meteo giusti insieme, e alcuni abboccano solo in una stagione.</p>
      <p>Il registro è il modo in cui avanzi. Le specie nuove aprono l’acqua successiva e le funzioni qui sopra, e ti danno il titolo: {F.titles.map((t) => `${w.title(t.id)} a ${t.species} specie`).join(', ')}. Tutti iniziano come {w.title(F.firstTitle)}. Idle Angler non ha XP né livelli.</p>
      <p>Ogni acqua ha anche un suo grado: {F.ranks.map((r) => w.lang.waterRanks[r]).join(', ')}, secondo la quota delle sue specie che hai nel registro. {w.lang.waterRanks.master} richiede tutte le specie di lì, visitatori di stagione e pesce epico compresi. Il tuo TRMNL mostra il tuo grado nell’acqua dove peschi, con tacche per le specie che mancano.</p>
      <h2 id="rankings">Classifiche e Open del fine settimana</h2>
      <p>Ogni acqua ha la sua classifica: il pesce più pesante che ogni pescatore ci ha preso, tenuto o rilasciato. Una classifica dura la settimana e riparte ogni lunedì alle 00:00 UTC; l’altra tiene i record di sempre. Il tuo TRMNL mostra la classifica della settimana dell’acqua dove peschi, e l’app le mostra tutte.</p>
      <p>Ogni fine settimana, dal sabato alle 00:00 alla domenica alle 23:59 UTC, ogni acqua organizza un Open per una specie, indicata nella pagina Classifiche. Prendi quel pesce lì per iscriverti; conta il più pesante. Il lunedì i primi tre di ogni acqua ricevono una medaglia e {e(F.prizes.map(n))} monete, e chi ha partecipato riceve una coccarda.</p>
      <h2 id="the-trophy-wall">La parete dei trofei</h2>
      <p>Un pesce di almeno il {F.trophies.minPercent}% del peso massimo della sua specie si può imbalsamare dal frigo invece di venderlo. Costa il valore del pesce più {F.trophies.fee} monete. La parete parte con {F.trophies.firstPegs} ganci e ne tiene fino a {F.trophies.maxPegs}; altri ganci si comprano nella pagina della parete. Medaglie e coccarde stanno sulla mensola, e la tua pagina pubblica mostra la parete quando è pubblica.</p>
      <h2 id="the-fly-box">La scatola delle mosche</h2>
      <p>Ogni settimana il tuo TRMNL mostra un codice mosca di sei cifre accanto al codice QR e nella barra del titolo. Scansiona il codice QR, o scrivi il codice nella pagina Diario, per aggiungere la mosca della settimana alla scatola. Il tuo pescatore porta la più recente sul cappello. Una mosca a settimana: ogni lunedì alle 00:00 UTC arriva un codice nuovo, e quello della settimana prima vale fino al lunedì dopo, nel caso lo schermo si sia aggiornato tardi. Dopo tutte le {F.flies} mosche, i modelli ricominciano. Le mosche non cambiano nulla nella pesca.</p>
      <h2 id="achievements">Traguardi</h2>
      <p>I traguardi hanno livelli, per la pesca, il registro, l’attrezzatura e le acque, il commercio e ogni specie. La pagina Traguardi, sotto Altro, mostra i tuoi livelli, la quota di pescatori che ha ciascuno e quanto manca al prossimo. Il tuo profilo pubblico li mostra quando c’è Idle Angler.</p>
      <h2 id="alerts">Avvisi</h2>
      <p>Attiva gli avvisi nelle Impostazioni della pagina Altro per ricevere una notifica su quel telefono quando il frigo si riempie o il pescatore resta senza esca. Sono spenti finché non li attivi, e ne ricevi al massimo due al giorno per tutti i tuoi giochi.</p>
      <h2 id="pausing-and-removing">Pausa e rimozione</h2>
      <p>Metti in pausa la pesca nelle Impostazioni della pagina Altro: niente catture finché non riprendi, e tieni tutto. Togliere il plugin da TRMNL conserva il tuo pescatore. Eliminare i progressi di Idle Angler nelle Impostazioni rimuove pescatore, frigo e registro, senza toccare l’account né gli altri giochi.</p>
      <h2 id="help">Aiuto</h2>
      <p>Scrivi a <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> con quello che mostra il tuo schermo e quando l’hai visto cambiare l’ultima volta.</p>
    </>
  ),
}
