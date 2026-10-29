import type { Rarity, Universe } from './types';

export const UNIVERSES: Universe[] = [
  {
    id: 'got',
    name: 'Game of Thrones',
    tagline: 'Les Sept Couronnes, les Maisons et leurs dragons.',
    packName: 'Coffret des Sept Royaumes',
    typeLabels: { personnage: 'Personnage', faction: 'Maison', lieu: 'Lieu', creature: 'Créature', objet: 'Objet' },
    theme: {
      accent: '#c9a45c',
      accentSoft: 'rgba(201, 164, 92, 0.16)',
      background: 'radial-gradient(ellipse at top, #2a2320 0%, #121012 60%)',
      cardBack: 'linear-gradient(135deg, #3b2a1e, #1a1414 60%, #4a3524)',
    },
  },
  {
    id: 'marvel',
    name: 'Marvel',
    tagline: "Héros, vilains et artefacts de l'univers cinématographique.",
    packName: 'Booster Multivers',
    typeLabels: { personnage: 'Personnage', faction: 'Équipe', lieu: 'Lieu', espece: 'Espèce', objet: 'Équipement' },
    theme: {
      accent: '#e2433f',
      accentSoft: 'rgba(226, 67, 63, 0.16)',
      background: 'radial-gradient(ellipse at top, #2b1618 0%, #101014 60%)',
      cardBack: 'linear-gradient(135deg, #7a1517, #17121a 60%, #1f2a52)',
    },
  },
  {
    id: 'starwars',
    name: 'Star Wars',
    tagline: 'Jedi, Sith, vaisseaux et planètes du canon.',
    packName: 'Cargaison Hyperspatiale',
    typeLabels: { personnage: 'Personnage', faction: 'Faction', lieu: 'Planète', espece: 'Espèce', vaisseau: 'Vaisseau', objet: 'Arme' },
    theme: {
      accent: '#ffd23f',
      accentSoft: 'rgba(255, 210, 63, 0.14)',
      background: 'radial-gradient(ellipse at top, #18203a 0%, #07080f 60%)',
      cardBack: 'linear-gradient(135deg, #1c2a55, #07080f 60%, #3a1c1c)',
    },
  },
  {
    id: 'hungergames',
    name: 'Hunger Games',
    tagline: 'Tributs, districts et arènes de Panem.',
    packName: 'Moisson du Capitole',
    typeLabels: { personnage: 'Personnage', faction: 'Faction', lieu: 'Lieu', creature: 'Mutation', objet: 'Objet' },
    theme: {
      accent: '#e8833a',
      accentSoft: 'rgba(232, 131, 58, 0.16)',
      background: 'radial-gradient(ellipse at top, #2a1d16 0%, #0f0d0c 60%)',
      cardBack: 'linear-gradient(135deg, #5a2410, #120e0c 60%, #3d3a36)',
    },
  },
  {
    id: 'harrypotter',
    name: 'Harry Potter',
    tagline: 'Sorciers, sortilèges et créatures du monde magique.',
    packName: 'Grimoire Scellé',
    typeLabels: { personnage: 'Personnage', faction: 'Maison & Ordre', lieu: 'Lieu', creature: 'Créature', sortilege: 'Sortilège', objet: 'Objet magique' },
    theme: {
      accent: '#b9a3f0',
      accentSoft: 'rgba(185, 163, 240, 0.16)',
      background: 'radial-gradient(ellipse at top, #221b33 0%, #0d0b14 60%)',
      cardBack: 'linear-gradient(135deg, #3a2a66, #0d0b14 60%, #5b4316)',
    },
  },
  {
    id: 'masseffect',
    name: 'Mass Effect',
    tagline: "Équipiers, races et mondes de la Voie lactée et d'Andromède.",
    packName: 'Caisse de ravitaillement',
    typeLabels: { personnage: 'Personnage', faction: 'Organisation', lieu: 'Monde', espece: 'Race', vaisseau: 'Vaisseau', objet: 'Arme', creature: 'Créature' },
    theme: {
      accent: '#4fc3f7',
      accentSoft: 'rgba(79, 195, 247, 0.15)',
      background: 'radial-gradient(ellipse at top, #10243a 0%, #06090f 60%)',
      cardBack: 'linear-gradient(135deg, #0f3554, #06090f 60%, #4a1414)',
    },
  },
];

export const RARITIES: { id: Rarity; label: string; color: string }[] = [
  { id: 'C', label: 'Commune', color: '#9aa3ad' },
  { id: 'PC', label: 'Peu commune', color: '#5cc48a' },
  { id: 'R', label: 'Rare', color: '#4f9cf0' },
  { id: 'E', label: 'Épique', color: '#b56cf0' },
  { id: 'L', label: 'Légendaire', color: '#f5b83d' },
];

export const RARITY_ORDER: Record<Rarity, number> = { C: 0, PC: 1, R: 2, E: 3, L: 4 };

export const rarityInfo = (id: Rarity) => RARITIES.find((r) => r.id === id)!;
