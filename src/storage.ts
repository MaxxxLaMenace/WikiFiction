import { useCallback, useEffect, useState } from 'react';
import type { Card, CardSet, Progress } from './types';
import { MAX_PACKS, regenerate } from './packs';
import { supabase } from './supabase';
import { useAuth } from './auth';
import { UNIVERSES } from './universes';

// ---------- Cache local ----------
// La partie invité garde sa clé d'origine ; chaque compte a son propre cache,
// qui sert aussi de copie de travail entre deux envois à Supabase.

const key = (universeId: string, userId: string | null) =>
  userId ? `wikifiction:v1:${userId}:${universeId}` : `wikifiction:v1:${universeId}`;

const freshProgress = (): Progress => ({ owned: {}, packs: MAX_PACKS, lastRegenAt: Date.now(), opened: 0 });

const isEmpty = (p: Progress) => p.opened === 0 && Object.keys(p.owned).length === 0;

export function loadProgress(universeId: string, userId: string | null = null): Progress {
  try {
    const raw = localStorage.getItem(key(universeId, userId));
    if (raw) return regenerate({ ...freshProgress(), ...JSON.parse(raw) });
  } catch {
    // Stockage indisponible ou corrompu : on repart de zéro.
  }
  return freshProgress();
}

function saveLocal(universeId: string, userId: string | null, progress: Progress) {
  try {
    localStorage.setItem(key(universeId, userId), JSON.stringify(progress));
  } catch {
    // Navigation privée ou quota plein : la partie reste en mémoire.
  }
}

// ---------- Supabase ----------

interface CollectionRow {
  universe_id: string;
  owned: Record<string, number>;
  packs: number;
  last_regen_at: string;
  opened: number;
}

const fromRow = (r: CollectionRow): Progress => ({
  owned: r.owned ?? {},
  packs: r.packs,
  lastRegenAt: Date.parse(r.last_regen_at),
  opened: r.opened,
});

const toRow = (userId: string, universeId: string, p: Progress) => ({
  user_id: userId,
  universe_id: universeId,
  owned: p.owned,
  packs: p.packs,
  last_regen_at: new Date(p.lastRegenAt).toISOString(),
  opened: p.opened,
  updated_at: new Date().toISOString(),
});

// Récupère les collections du compte dans le cache local, une fois par session.
// Si le compte est vierge, la partie invité de ce navigateur y est importée.
const syncs = new Map<string, Promise<void>>();

function syncFromRemote(userId: string): Promise<void> {
  if (!syncs.has(userId)) {
    const sync = (async () => {
      const { data, error } = await supabase!
        .from('collections')
        .select('universe_id, owned, packs, last_regen_at, opened')
        .eq('user_id', userId);
      if (error) throw error;

      if (data.length > 0) {
        for (const row of data as CollectionRow[]) saveLocal(row.universe_id, userId, regenerate(fromRow(row)));
        return;
      }
      const guest = UNIVERSES.map((u) => [u.id, loadProgress(u.id)] as const).filter(([, p]) => !isEmpty(p));
      if (guest.length === 0) return;
      const { error: importError } = await supabase!.from('collections').upsert(guest.map(([id, p]) => toRow(userId, id, p)));
      if (importError) throw importError;
      for (const [id, p] of guest) saveLocal(id, userId, p);
    })();
    // En cas d'échec, on réessaiera au prochain écran.
    sync.catch(() => syncs.delete(userId));
    syncs.set(userId, sync);
  }
  return syncs.get(userId)!;
}

// Envois regroupés : au plus un par univers et par seconde.
const pending = new Map<string, ReturnType<typeof toRow>>();
let flushTimer: ReturnType<typeof setTimeout> | undefined;

function flush() {
  clearTimeout(flushTimer);
  if (!supabase || pending.size === 0) return;
  const rows = [...pending.values()];
  pending.clear();
  supabase
    .from('collections')
    .upsert(rows)
    .then(({ error }) => error && console.error('Sauvegarde Supabase impossible', error));
}

function pushRemote(userId: string, universeId: string, progress: Progress) {
  pending.set(`${userId}:${universeId}`, toRow(userId, universeId, progress));
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 1000);
}

window.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());

// ---------- Hooks ----------

export function useProgress(universeId: string) {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;
  const [progress, setProgress] = useState(() => loadProgress(universeId, userId));
  // Faux tant que la collection du compte n'est pas chargée : on évite d'ouvrir
  // un paquet sur une copie locale périmée.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    if (loading) return;
    setProgress(loadProgress(universeId, userId));
    if (!userId || !supabase) {
      setReady(true);
      return;
    }
    syncFromRemote(userId)
      .catch((error) => console.error('Chargement Supabase impossible', error))
      .finally(() => {
        if (cancelled) return;
        setProgress(loadProgress(universeId, userId));
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [universeId, userId, loading]);

  const persist = useCallback(
    (next: Progress) => {
      saveLocal(universeId, userId, next);
      if (userId && supabase) pushRemote(userId, universeId, next);
    },
    [universeId, userId],
  );

  const update = useCallback(
    (fn: (p: Progress) => Progress) => {
      setProgress((prev) => {
        const next = fn(regenerate(prev));
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // Fait apparaître les paquets régénérés sans action du joueur. La recharge se
  // déduit de lastRegenAt, inutile de l'envoyer à Supabase.
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = regenerate(prev);
        if (next !== prev) saveLocal(universeId, userId, next);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [universeId, userId]);

  const reset = useCallback(() => {
    const next = freshProgress();
    persist(next);
    setProgress(next);
  }, [persist]);

  return { progress, update, reset, ready };
}

const setCache = new Map<string, Promise<CardSet>>();

export function useCardSet(universeId: string): Card[] | null {
  const [cards, setCards] = useState<Card[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    setCards(null);
    if (!setCache.has(universeId)) {
      setCache.set(universeId, fetch(`${import.meta.env.BASE_URL}data/${universeId}.json`).then((r) => r.json()));
    }
    setCache.get(universeId)!.then((set) => !cancelled && setCards(set.cards));
    return () => {
      cancelled = true;
    };
  }, [universeId]);
  return cards;
}
