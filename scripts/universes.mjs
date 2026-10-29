// Configuration des univers pour la génération des cartes.
// - seeds : catégories dont les membres s'ajoutent aux candidats (avec `depth`
//   niveaux de sous-catégories), en plus des pages les plus liées et les plus longues.
// - types : testés dans l'ordre, la première règle dont une catégorie de la page
//   correspond l'emporte ; `max` plafonne le nombre de cartes de ce type, et
//   `linked` n'accepte que les pages parmi les 1000 plus liées du wiki.
// - exclude : écarte la page si une de ses catégories correspond.
// - skip : écarte la page si son titre correspond (pages trop génériques). Les pages
//   qui portent le nom d'une catégorie de départ sont écartées automatiquement.

const COMMON_EXCLUDE = [/^Category:(Episodes|Seasons|Real-world|Timeline|Disambiguation|Costumes|Lists?\b)/i];

export const UNIVERSES = [
  {
    id: 'got',
    wiki: 'gameofthrones',
    require: null,
    seeds: ['Category:Great Houses', 'Category:Noble houses', 'Category:Cities', 'Category:Castles', 'Category:Regions', 'Category:Organizations', 'Category:Religions', 'Category:Weapons', 'Category:Objects', 'Category:Dragons', 'Category:Animals'],
    depth: 1,
    exclude: [...COMMON_EXCLUDE, /^Category:(Differences in adaptation|Culture$|History$|Pages on canon media)/i],
    types: [
      { id: 'personnage', max: 110, match: [/^Category:Individuals appearing in/i, /^Category:Members of House/i] },
      { id: 'creature', max: 10, match: [/^Category:Dragons$/i, /^Category:(Animals|Creatures|Direwolves)$/i] },
      { id: 'faction', max: 30, match: [/^Category:(Great Houses|Noble houses|Organizations|Religions|Military units)$/i, /^Category:Houses (of|from)/i] },
      { id: 'objet', max: 15, match: [/^Category:(Weapons|Objects|Valyrian steel weapons|Artifacts)$/i] },
      { id: 'lieu', max: 35, match: [/^Category:(Cities|Castles|Regions|Islands|Settlements|Rivers|Seas|Continents)$/i, /^Category:(Castles|Cities|Locations) (in|of)/i] },
    ],
  },
  {
    id: 'marvel',
    wiki: 'marvelcinematicuniverse',
    require: null,
    seeds: ['Category:Organizations', 'Category:Teams', 'Category:Locations', 'Category:Planets', 'Category:Items', 'Category:Weapons', 'Category:Races', 'Category:Vehicles'],
    depth: 0,
    exclude: [...COMMON_EXCLUDE, /^Category:(Films|TV Series|Real People|Comics|Video Games|Soundtracks|Universes|Trivia|Deleted Scenes)$/i, /^Category:Alternate Universe/i],
    types: [
      { id: 'personnage', max: 110, match: [/^Category:Characters$/i] },
      { id: 'espece', max: 15, match: [/^Category:Races$/i] },
      { id: 'faction', max: 30, match: [/^Category:(Organizations|Teams)$/i] },
      { id: 'objet', max: 20, match: [/^Category:(Items|Weapons|Vehicles)$/i] },
      { id: 'lieu', max: 25, match: [/^Category:(Locations|Planets)$/i] },
    ],
  },
  {
    id: 'starwars',
    wiki: 'starwars',
    // On ne garde que le canon, pas les Légendes.
    require: /^Category:Canon articles$/i,
    seeds: ['Category:Planets', 'Category:Starship classes', 'Category:Sentient species', 'Category:Organizations', 'Category:Weapons', 'Category:Lightsabers', 'Category:Sith Lords'],
    depth: 1,
    exclude: [...COMMON_EXCLUDE, /^Category:(Battles|Conflicts|Years|Books|Comics|Video games|Films|Television|Novels|Reference books|Media timelines)/i],
    types: [
      { id: 'personnage', max: 90, match: [/^Category:(Males|Females)$/i, /^Category:Individuals with .* pronouns$/i] },
      { id: 'vaisseau', max: 30, match: [/(starship|starfighter|freighter|transport|shuttle) classes$/i, /Star (Destroyer|Dreadnought)s$/i, /^Category:(Individual starships|Light freighters)$/i, /light freighters$/i] },
      { id: 'espece', max: 15, match: [/^Category:(Sentient species|Species)$/i, /species$/i] },
      { id: 'faction', max: 20, match: [/^Category:(Organizations|Governments|Military units|Criminal organizations)$/i, /organizations$/i] },
      { id: 'objet', max: 15, match: [/^Category:(Weapons|Lightsabers|Artifacts|Kyber crystals)$/i, /lightsabers$/i] },
      { id: 'lieu', max: 30, match: [/^Category:(Planets|Moons|Cities|Space stations)$/i, /planets$/i, /^Category:(Planets|Moons|Cities) (in|of)/i] },
    ],
  },
  {
    id: 'hungergames',
    wiki: 'thehungergames',
    require: null,
    seeds: ['Category:Characters', 'Category:Victors', 'Category:Tributes', 'Category:Districts', 'Category:Locations', 'Category:Capitol locations', 'Category:Arenas', 'Category:Panem', 'Category:Organizations', 'Category:Weapons', 'Category:Technology', 'Category:Muttations', 'Category:Animals'],
    depth: 1,
    exclude: [...COMMON_EXCLUDE, /^Category:(Books|Films|Games|Actors|Cast|Real world|Merchandise|Chapters|Soundtracks?|Songs)/i],
    types: [
      { id: 'personnage', max: 80, match: [/characters$/i, /^Category:(Victors|Tributes|Females|Males)$/i, /^Category:Tributes (from|in)/i] },
      { id: 'creature', max: 10, match: [/^Category:(Muttations|Animals)$/i] },
      { id: 'faction', max: 6, match: [/^Category:Organizations$/i] },
      { id: 'objet', max: 15, match: [/^Category:(Weapons|Technology)$/i] },
      { id: 'lieu', max: 25, match: [/^Category:(Districts|Locations|Capitol locations|Arenas|Panem)$/i, /locations$/i] },
    ],
  },
  {
    id: 'harrypotter',
    wiki: 'harrypotter',
    require: null,
    seeds: ['Category:Wizards', 'Category:Death Eaters', 'Category:Order of the Phoenix', 'Category:Hogwarts', 'Category:Locations', 'Category:Creatures', 'Category:Beings', 'Category:Spells', 'Category:Charms', 'Category:Curses', 'Category:Magical objects', 'Category:Wands', 'Category:Deathly Hallows', 'Category:Horcruxes', 'Category:Organisations', 'Category:Potions'],
    depth: 1,
    // Le contenu propre aux jeux mobiles noierait les livres et les films.
    exclude: [...COMMON_EXCLUDE, /^Category:(Video games|Films|Books|Actors|Media) \(real-world\)/i, /^Category:(Harry Potter: (Hogwarts Mystery|Wizards Unite|Magic Awakened)|Hogwarts Legacy|Brilliant Events?)\b/i],
    skip: [/^(Charm|Spell|Wand|Potion|Potions \(class\)|Beast|Being|Customs|Christmas holidays|Nastily Exhausting Wizarding Test|Jacob's sibling|Hogwarts Houses)$/i, /^Brilliant Event/i, /Work Experience/i],
    types: [
      // Les personnages des jeux mobiles ne sont pas catégorisés comme tels mais
      // sont peu cités : on ne garde que les personnages parmi les plus liés du wiki.
      { id: 'personnage', max: 80, linked: true, match: [/^Category:(Wizards|Witches|Muggles|Squibs|Females|Males)$/i] },
      { id: 'objet', max: 30, match: [/^Category:(Magical objects|Wands|Deathly Hallows|Horcruxes|Potions|Brooms|Broomsticks)$/i, /wands$/i] },
      { id: 'sortilege', max: 25, match: [/^Category:(Charms|Curses|Hexes|Jinxes|Transfigurations|Counter-spells)$/i, /spells$/i] },
      { id: 'lieu', max: 20, match: [/^Category:(Villages|Shops|Buildings|Schools|Triwizard schools|Wizarding schools|Streets|Forests|Diagon Alley|Hogsmeade)$/i, /locations$/i, /^Category:Locations in/i] },
      { id: 'faction', max: 12, match: [/^Category:(Death Eaters|Order of the Phoenix|Dumbledore's Army|Ministries of Magic|Advocacy groups|Secret societies)$/i, /^Category:\w+ House$/i] },
      { id: 'creature', max: 20, match: [/^Category:Creatures (found|from)/i, /^Category:(Care of Magical Creatures|Dragons|Ghosts|Beings)$/i] },
    ],
  },
  {
    id: 'masseffect',
    wiki: 'masseffect',
    require: null,
    seeds: ['Category:Squad Members', 'Category:Recurring Characters', 'Category:Characters', 'Category:Races', 'Category:Starships', 'Category:Organizations', 'Category:Weapons', 'Category:Planets', 'Category:Space Stations', 'Category:Creatures', 'Category:Wildlife'],
    depth: 0,
    exclude: [...COMMON_EXCLUDE, /^Category:(Missions|Assignments|Achievements|Trophies|DLC|Games|Novels|Comics|Multiplayer|Upgrades|Armor|Mods|Codex)$/i],
    skip: [/\(enemy\)$/i, /\bGuide\b/i,/^(Assault Rifles|Shotguns|Sniper Rifles|Pistols|Heavy Weapons|Submachine Guns|Weapon Mods|Research)$/i],
    types: [
      { id: 'personnage', max: 80, match: [/^Category:(Squad Members|Recurring Characters|Characters)$/i] },
      { id: 'vaisseau', max: 15, match: [/^Category:(Starships|Normandy)$/i] },
      { id: 'espece', max: 20, match: [/^Category:(Races|Citadel Races)$/i] },
      { id: 'creature', max: 10, match: [/^Category:(Creatures|Wildlife)$/i] },
      { id: 'faction', max: 20, match: [/^Category:Organizations$/i] },
      { id: 'objet', max: 20, match: [/^Category:Weapons$/i, /^Category:(Assault Rifles|Shotguns|Sniper Rifles|Pistols|Heavy Weapons|Submachine Guns)$/i] },
      { id: 'lieu', max: 30, match: [/^Category:(Planets|Space Stations|Citadel|Locations)$/i] },
    ],
  },
];
