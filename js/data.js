/* ============================================================
   Ishtmi – Seiteninhalte
   Hier kannst du alles anpassen: Streamplan, News, Games, Setup.
   Die Seite liest diese Daten beim Laden ein – kein Build nötig.
   ============================================================ */

const SITE = {
  name: "Ishtmi",
  channel: "ishtmi",
  twitch: "https://www.twitch.tv/ishtmi",
  discord: "https://discord.gg/UdP7qkwPY7",
  avatar: "https://static-cdn.jtvnw.net/jtv_user_pictures/da2e2ef8-3df0-4442-a39f-84fad3b5e6af-profile_image-300x300.png",
};

/* ---------- Hero & Scroll-Szenen ----------
   Offizielle Planet-Zoo-2-Screenshots vom Steam-Store (Hotlink, © Frontier Developments)
   und Ishtmis eigene Workshop-Bilder. Hash = Steam-Screenshot-ID. */
const PZ2 = (hash) => `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3219030/${hash}/ss_${hash}.1920x1080.jpg`;
const WS_IMG = (ugc) => `https://images.steamusercontent.com/ugc/${ugc}/?imw=1920&imh=1080&ima=fit&impolicy=Letterbox&letterbox=false`;

const HERO = {
  /* Offizieller Launch-Trailer (HLS-Stream von Steam). Leer lassen = nur Diashow. */
  video: "https://video.akamai.steamstatic.com/store_trailers/3219030/694976577/c9b3cd63e5ccf69a0bd10955e59252fd7fc68d34/1791883205/hls_264_master.m3u8",
  /* Der Trailer beginnt mit schwarzem Logo-Vorspann: Einstieg und Schleife ab dieser Sekunde. */
  videoStart: 4.5,
  /* Sekunden vor dem Ende, ab denen zurück auf videoStart gesprungen wird (Abspann überspringen). */
  videoTrimEnd: 1,
  /* Diashow mit Ken-Burns-Effekt: läuft, bis das Video bereit ist, und als Fallback. */
  slides: [
    PZ2("cd9c22ffb7ab15497c8db78764fac7c4a9ed95ac"),   // Elefanten am Wasserloch
    PZ2("c4a96f5b0e761e5af6fd5f6b93caf382693835fe"),   // Tiger
    PZ2("4bb2d773a53e0c5e3c6e50227c8bd650c51c83b3"),   // Manta unter Wasser
    PZ2("4648b7f1f7f7646aab4a4058d8297f80cd298c82"),   // Adler im Flug
  ],
  slideSeconds: 8,
};

/* ---------- Welt: ein Biom pro Stockwerk ----------
   Liegt als fixe Ebene hinter allen normalen Sektionen und wechselt beim Scrollen.
   critters: Entdeckungen pro Etage – birds, leaves, giraffe, bubbles, fish, butterflies,
   balloons, elephant, stars, gondola */
const WORLD = {
  stream:   { floor: "01", name: "Eingang & Savanne", icon: "🦁", image: PZ2("c4466cde5bd6f41dc16ce7265b6decfcc24151c4"), critters: ["birds"] },
  info:     { floor: "02", name: "Dschungel",         icon: "🌴", image: PZ2("06315faf196c03173ae0b6f5b10c02b6d084c4c4"), critters: ["leaves", "giraffe", "butterflies"] },
  plan:     { floor: "03", name: "Aquarium",          icon: "🐠", image: PZ2("da740b79f5ed40cc1db031352cbe28fda8ef0431"), critters: ["bubbles", "fish"] },
  news:     { floor: "04", name: "Besucherplatz",     icon: "🎈", image: PZ2("fced1b961dc0855e786d27dd6c89fc3e10a4201c"), critters: ["balloons", "birds"] },
  workshop: { floor: "05", name: "Baustelle",         icon: "🏗️", image: WS_IMG("1870709954304791087/3885A29C8831E895451402A79144E570614EB5D0"), critters: ["elephant"] },
  games:    { floor: "06", name: "Nachtzoo",          icon: "🌙", image: PZ2("4947a33a033aca9a41b19281fca606e0d4f6b54a"), critters: ["stars", "fireflies"] },
  setup:    { floor: "07", name: "Seilbahn",          icon: "🚡", image: PZ2("4648b7f1f7f7646aab4a4058d8297f80cd298c82"), critters: ["gondola", "birds"] },
};

/* effect: "pan" | "dive" | "wipe" | "dusk" | "zoomout" */
const SCENES = [
  {
    id: "savanne", effect: "pan",
    image: PZ2("76ed3251861e8e07ffef2db6889f5174fb674a1e"),
    eyebrow: "Szene 1 · Savanne",
    title: "Raus in die Wildnis",
    text: "Planet Zoo 2 endet nicht am Zoozaun: Naturschutzgebiete, Safari-Touren und Tiere, die du in die Freiheit entlässt.",
    credit: "Bild: Planet Zoo 2 © Frontier Developments",
  },
  {
    id: "tiefsee", effect: "dive",
    image: PZ2("4bb2d773a53e0c5e3c6e50227c8bd650c51c83b3"),
    eyebrow: "Szene 2 · Unter Wasser",
    title: "Abtauchen",
    text: "Reine Wassertiere, Tunnel-Aquarien und Riffe sind neu in Planet Zoo 2. Im Stream wird geplant, gebaut und gestaunt.",
    credit: "Bild: Planet Zoo 2 © Frontier Developments",
  },
  {
    id: "workshop", effect: "wipe",
    image: WS_IMG("2042991568422884058/78762AF733987CBA75DA9499BD45900E5792A6A7"),
    image2: WS_IMG("2030597795299165926/6C6A5376AF3B9B1A0443E4235C45546234C43342"),
    label: "Ägyptischer Tempel", label2: "greek coast",
    eyebrow: "Szene 3 · Selbst gebaut",
    title: "Von Ishtmi gebaut",
    text: "Tempel, Küsten, Kuppeln: Was im Stream entsteht, landet im Steam Workshop. Zieh den Regler, indem du scrollst.",
    credit: "Bilder: Ishtmi, Steam Workshop",
  },
  {
    id: "nacht", effect: "dusk",
    image: PZ2("6fd0f6b14e347770053ab7dd540d1daaca94e417"),
    eyebrow: "Szene 4 · Spätschicht",
    title: "Der Zoo schläft nie",
    text: "Mal vormittags, mal abends: Durch Schichtarbeit wechselt die Streamzeit. Der Streamplan sagt dir, wann es losgeht.",
    link: "#plan", linkText: "Zum Streamplan",
    credit: "Bild: Planet Zoo 2 © Frontier Developments",
  },
  {
    id: "zoo", effect: "zoomout",
    image: PZ2("06315faf196c03173ae0b6f5b10c02b6d084c4c4"),
    eyebrow: "Szene 5 · Dein Zoo wartet",
    title: "Komm vorbei",
    text: "Ob zum Mitbauen, Quatschen oder einfach Zuschauen: Dienstag bis Sonntag live auf Twitch.",
    link: "https://www.twitch.tv/ishtmi", linkText: "Auf Twitch ansehen", external: true,
    credit: "Bild: Planet Zoo 2 © Frontier Developments",
  },
];

/* ---------- Streamplan ----------
   slot: "offline" | "vormittags" | "abends"
   dayIndex: 0 = Sonntag … 6 = Samstag (wie JavaScript)
   time: optionale Uhrzeit, z. B. "ab ca. 19 Uhr" – leer lassen, wenn nicht fix */
const SCHEDULE = [
  { dayIndex: 1, day: "Montag",     short: "Mo", slot: "offline" },
  { dayIndex: 2, day: "Dienstag",   short: "Di", slot: "abends",     time: "" },
  { dayIndex: 3, day: "Mittwoch",   short: "Mi", slot: "vormittags", time: "" },
  { dayIndex: 4, day: "Donnerstag", short: "Do", slot: "abends",     time: "" },
  { dayIndex: 5, day: "Freitag",    short: "Fr", slot: "offline" },
  { dayIndex: 6, day: "Samstag",    short: "Sa", slot: "abends",     time: "", special: "Bastelei",     note: "Bauen, basteln, dekorieren – der Kreativtag." },
  { dayIndex: 0, day: "Sonntag",    short: "So", slot: "abends",     time: "", special: "Sammelsurium", note: "SammlerSonntach: Sammeln, Sortieren, Entspannen." },
];

/* start: typische Startzeit für den Countdown (Format "HH:MM", deutsche Zeit).
   approx: true → wird als "ca." angezeigt. hours: wie lange der Stream ungefähr läuft. */
const SLOTS = {
  offline:    { label: "Offline",    hint: "Kein Stream",            icon: "🌙" },
  vormittags: { label: "Vormittags", hint: "Frühschicht-Stream",     icon: "☀️", start: "10:00", approx: true, hours: 4 },
  abends:     { label: "Abends",     hint: "Feierabend-Stream",      icon: "🌆", start: "19:00", approx: true, hours: 4 },
};

/* ---------- Info-Kacheln ---------- */
const FEATURES = [
  { icon: "🦒", title: "Planet Zoo 1 & 2", text: "Kampagne, Franchise und Building Days – von der ersten Hütte bis zum Mega-Zoo." },
  { icon: "☕", title: "Cozy & entspannt", text: "Kein Hektik-Content. Einfach gemütlich zuschauen, mitbauen oder quatschen." },
  { icon: "🇩🇪", title: "Auf Deutsch", text: "Stream und Chat komplett auf Deutsch – jede:r ist willkommen." },
  { icon: "🎬", title: "FHD60 & smooth", text: "Volle HD-Auflösung mit 60 FPS – flüssiges Gameplay ohne Ruckler." },
  { icon: "🎁", title: "Drops aktiviert", text: "Wenn ein Spiel Drops anbietet, sind sie im Stream aktiv. Einschalten lohnt sich." },
  { icon: "🔧", title: "Schichtarbeit-Plan", text: "Mal vormittags, mal abends – der Streamplan verrät, wann's losgeht." },
];

/* ---------- News ----------
   Neueste zuerst. date im Format JJJJ-MM-TT. */
const NEWS = [
  {
    date: "2026-11-01",
    tag: "Planet Zoo 2",
    title: "Planet Zoo 2 läuft – Kampagne und Franchise",
    text: "Der neue Zoo ist eröffnet! Im Stream geht es durch die Kampagne und parallel wächst das Franchise. Building Days inklusive.",
    link: "https://www.twitch.tv/ishtmi",
    linkText: "Zum Stream",
  },
  {
    date: "2026-10-25",
    tag: "Stream",
    title: "SammlerSonntach ist zurück",
    text: "Sonntags gibt's abends das Sammelsurium: ein bisschen von allem, locker und ohne festen Plan. Perfekt zum Ausklingen des Wochenendes.",
  },
  {
    date: "2026-10-18",
    tag: "Community",
    title: "Discord ist offen",
    text: "Streamankündigungen, Zoo-Screenshots und Planet-Zoo-Tipps – komm in den Discord und bleib auf dem Laufenden.",
    link: "https://discord.gg/UdP7qkwPY7",
    linkText: "Discord beitreten",
  },
  {
    date: "2026-10-11",
    tag: "Games",
    title: "Graveyard Keeper II im Programm",
    text: "Neben Planet Zoo läuft jetzt auch Graveyard Keeper II – Friedhof statt Gehege, aber genauso gemütlich.",
  },
];

/* ---------- Games ----------
   status: "aktuell" | "geplant" | "pausiert" */
const GAMES = [
  { name: "Planet Zoo 2",            status: "aktuell",  cover: "https://static-cdn.jtvnw.net/ttv-boxart/1510789205_IGDB-285x380.jpg", note: "Kampagne & Franchise – das Hauptspiel im Stream." },
  { name: "Graveyard Keeper II",     status: "aktuell",  cover: "https://static-cdn.jtvnw.net/ttv-boxart/2106755390_IGDB-285x380.jpg", note: "Mittelalterlicher Friedhofs-Simulator mit schwarzem Humor." },
  { name: "Planet Zoo",              status: "geplant",  cover: "https://static-cdn.jtvnw.net/ttv-boxart/Planet%20Zoo-285x380.jpg",   note: "Der Klassiker – kommt wieder auf den Plan." },
  { name: "Surviving Mars",          status: "pausiert", cover: "https://static-cdn.jtvnw.net/ttv-boxart/Surviving%20Mars-285x380.jpg", note: "Kolonie auf dem Mars – aktuell pausiert." },
  { name: "Kena: Bridge of Spirits", status: "pausiert", cover: "https://static-cdn.jtvnw.net/ttv-boxart/Kena%3A%20Bridge%20of%20Spirits-285x380.jpg", note: "Action-Adventure mit viel Herz." },
  { name: "Anno 2205",               status: "pausiert", cover: "https://static-cdn.jtvnw.net/ttv-boxart/Anno%202205-285x380.jpg",     note: "Aufbau auf Erde und Mond." },
  { name: "Planet Crafter",          status: "pausiert", cover: "https://static-cdn.jtvnw.net/ttv-boxart/Planet%20Crafter-285x380.jpg", note: "Terraforming-Survival." },
  { name: "Satisfactory",            status: "pausiert", cover: "https://static-cdn.jtvnw.net/ttv-boxart/Satisfactory-285x380.jpg",     note: "Fabriken, Förderbänder, Chaos." },
  { name: "Hogwarts Legacy",         status: "pausiert", cover: "https://static-cdn.jtvnw.net/ttv-boxart/1095275650_IGDB-285x380.jpg", note: "Pausiert – räudige Engine-Technik." },
];

const GAME_STATUS = {
  aktuell:  { label: "Aktuell",  color: "var(--accent-2)" },
  geplant:  { label: "Geplant",  color: "var(--accent)" },
  pausiert: { label: "Pausiert", color: "var(--muted)" },
};

/* ---------- Setup ---------- */
const SETUP = [
  {
    title: "Rechner", icon: "🖥️",
    items: [
      "be quiet! Silent Base 802 (weiß)",
      "MSI B650 Gaming Plus WiFi (AM5)",
      "AMD Ryzen 7 7800X3D",
      "32 GB G.Skill Flare X5 DDR5-6000",
      "ZOTAC GeForce RTX 4090 AMP Extreme Airo (24 GB)",
      "4 TB Crucial P3 SSD (M.2, PCIe 3.0)",
      "850 W be quiet! Pure Power 12 M",
    ],
  },
  {
    title: "Zubehör", icon: "🎧",
    items: [
      "Acer Nitro 24\"",
      "DELL P2411H 24\" FHD 60 Hz",
      "Logitech G635 Headset",
      "Razer Seiren (old)",
      "Elgato Stream Deck XL",
      "Korg nanoKONTROL 2",
      "Logitech Standard-Tastatur",
      "SteelSeries Aerox 5",
    ],
  },
  {
    title: "Software & Plugins", icon: "🧩",
    items: [
      "OBS Studio",
      "StreamElements",
      "Midi2OBS",
      "NVIDIA Broadcast",
      "Sound Alerts",
    ],
  },
];
