import type { Card, Progress, Rarity } from './types';
import { RARITY_ORDER } from './universes';

export const CARDS_PER_PACK = 5;
export const MAX_PACKS = 5;
export const REGEN_MS = 60 * 60 * 1000;

// Probabilités (en %) des emplacements normaux, et du dernier emplacement
// qui garantit au moins une Rare.
const SLOT_WEIGHTS: Record<Rarity, number> = { C: 62, PC: 25, R: 9, E: 3.2, L: 0.8 };
const LAST_SLOT_WEIGHTS: Record<Rarity, number> = { C: 0, PC: 0, R: 76, E: 19, L: 5 };

function pickRarity(weights: Record<Rarity, number>): Rarity {
  const entries = Object.entries(weights) as [Rarity, number][];
  let roll = Math.random() * entries.reduce((sum, [, w]) => sum + w, 0);
  for (const [rarity, weight] of entries) {
    roll -= weight;
    if (roll < 0) return rarity;
  }
  return entries[entries.length - 1][0];
}

export function openPack(cards: Card[]): Card[] {
  const byRarity = Object.groupBy(cards, (c) => c.rarity);
  const drawn: Card[] = [];
  for (let slot = 0; slot < CARDS_PER_PACK; slot++) {
    const weights = slot === CARDS_PER_PACK - 1 ? LAST_SLOT_WEIGHTS : SLOT_WEIGHTS;
    const pool = byRarity[pickRarity(weights)] ?? cards;
    // Pas deux fois la même carte dans un paquet si on peut l'éviter.
    const fresh = pool.filter((c) => !drawn.includes(c));
    const candidates = fresh.length > 0 ? fresh : pool;
    drawn.push(candidates[Math.floor(Math.random() * candidates.length)]);
  }
  return drawn.sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);
}

// Ajoute les paquets régénérés depuis la dernière recharge.
export function regenerate(progress: Progress, now = Date.now()): Progress {
  // Au maximum, le minuteur est relancé à l'ouverture suivante ; on ramène aussi
  // au plafond les sauvegardes faites avec un ancien maximum plus élevé.
  if (progress.packs >= MAX_PACKS) return progress.packs === MAX_PACKS ? progress : { ...progress, packs: MAX_PACKS };
  const gained = Math.floor((now - progress.lastRegenAt) / REGEN_MS);
  if (gained <= 0) return progress;
  const packs = Math.min(MAX_PACKS, progress.packs + gained);
  const lastRegenAt = packs >= MAX_PACKS ? now : progress.lastRegenAt + gained * REGEN_MS;
  return { ...progress, packs, lastRegenAt };
}

export function msUntilNextPack(progress: Progress, now = Date.now()): number | null {
  if (progress.packs >= MAX_PACKS) return null;
  return Math.max(0, progress.lastRegenAt + REGEN_MS - now);
}
