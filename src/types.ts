export type Rarity = 'C' | 'PC' | 'R' | 'E' | 'L';

export interface Card {
  id: string;
  name: string;
  type: string;
  rarity: Rarity;
  image: string;
  summary: string | null;
  url: string;
}

export interface CardSet {
  universe: string;
  source: string;
  cards: Card[];
}

export interface Universe {
  id: string;
  name: string;
  tagline: string;
  packName: string;
  // Libellés des types de cartes propres à l'univers.
  typeLabels: Record<string, string>;
  theme: {
    accent: string;
    accentSoft: string;
    background: string;
    cardBack: string;
  };
}

// Progression locale d'un joueur dans un univers.
export interface Progress {
  owned: Record<string, number>;
  packs: number;
  lastRegenAt: number;
  opened: number;
}
