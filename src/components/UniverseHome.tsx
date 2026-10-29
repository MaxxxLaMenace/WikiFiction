import { useEffect, useState } from 'react';
import type { Card, Universe } from '../types';
import { MAX_PACKS, msUntilNextPack, openPack } from '../packs';
import { useCardSet, useProgress } from '../storage';
import { RARITY_ORDER } from '../universes';
import CardView from './CardView';
import CardModal from './CardModal';

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

const formatDuration = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return s >= 3600 ? `${Math.floor(s / 3600)}:${mm}:${ss}` : `${mm}:${ss}`;
};

interface Opening {
  cards: Card[];
  newIds: Set<string>;
  revealed: boolean[];
}

export default function UniverseHome({ universe }: { universe: Universe }) {
  const cards = useCardSet(universe.id);
  const { progress, update, ready } = useProgress(universe.id);
  const now = useNow();
  const [opening, setOpening] = useState<Opening | null>(null);
  const [detail, setDetail] = useState<Card | null>(null);

  if (!cards) return <p className="loading">Chargement des cartes…</p>;

  const ownedCount = cards.filter((c) => progress.owned[c.id]).length;
  const nextIn = msUntilNextPack(progress, now);

  const canOpen = ready && progress.packs > 0;

  const open = () => {
    if (!canOpen) return;
    const drawn = openPack(cards);
    const newIds = new Set(drawn.filter((c) => !progress.owned[c.id]).map((c) => c.id));
    update((p) => {
      const owned = { ...p.owned };
      for (const c of drawn) owned[c.id] = (owned[c.id] ?? 0) + 1;
      // Le minuteur ne démarre qu'en quittant le maximum.
      const lastRegenAt = p.packs >= MAX_PACKS ? Date.now() : p.lastRegenAt;
      return { ...p, owned, packs: p.packs - 1, lastRegenAt, opened: p.opened + 1 };
    });
    setOpening({ cards: drawn, newIds, revealed: drawn.map(() => false) });
  };

  if (opening) {
    const allRevealed = opening.revealed.every(Boolean);
    const reveal = (i: number) =>
      setOpening({ ...opening, revealed: opening.revealed.map((r, j) => r || j === i) });
    const best = opening.cards.reduce((a, b) => (RARITY_ORDER[b.rarity] > RARITY_ORDER[a.rarity] ? b : a));

    return (
      <section className="opening">
        <h2>{universe.packName}</h2>
        <p className="opening-hint">
          {allRevealed ? `Meilleure carte : ${best.name}` : 'Clique sur les cartes pour les retourner.'}
        </p>
        <div className="opening-row">
          {opening.cards.map((card, i) => (
            <div key={i} className={`flip${opening.revealed[i] ? ' flipped' : ''}`}>
              <CardView
                card={card}
                universe={universe}
                faceDown={!opening.revealed[i]}
                isNew={opening.newIds.has(card.id)}
                onClick={() => (opening.revealed[i] ? setDetail(card) : reveal(i))}
              />
            </div>
          ))}
        </div>
        <div className="opening-actions">
          {allRevealed ? (
            <>
              <button type="button" className="btn" onClick={() => setOpening(null)}>Terminer</button>
              {canOpen && (
                <button type="button" className="btn btn-primary" onClick={open}>Ouvrir un autre paquet</button>
              )}
            </>
          ) : (
            <button type="button" className="btn" onClick={() => setOpening({ ...opening, revealed: opening.revealed.map(() => true) })}>
              Tout révéler
            </button>
          )}
        </div>
        {detail && (
          <CardModal card={detail} universe={universe} copies={progress.owned[detail.id] ?? 0} onClose={() => setDetail(null)} />
        )}
      </section>
    );
  }

  return (
    <section className="home">
      <div className="pack-stage">
        <button type="button" className="pack" onClick={open} disabled={!canOpen}>
          <span className="pack-name">{universe.packName}</span>
          <span className="pack-sub">5 cartes · 1 Rare minimum</span>
        </button>
        <div className="pack-status">
          <strong>{progress.packs}</strong> / {MAX_PACKS} paquets
          {nextIn !== null && <span> · prochain dans {formatDuration(nextIn)}</span>}
        </div>
        <button type="button" className="btn btn-primary" onClick={open} disabled={!canOpen}>
          {!ready ? 'Chargement de ta collection…' : progress.packs > 0 ? 'Ouvrir un paquet' : 'Plus de paquets pour le moment'}
        </button>
      </div>
      <div className="stats">
        <div><strong>{ownedCount}</strong><span>cartes uniques sur {cards.length}</span></div>
        <div><strong>{Math.round((ownedCount / cards.length) * 100)} %</strong><span>de l'album complété</span></div>
        <div><strong>{progress.opened}</strong><span>paquets ouverts</span></div>
      </div>
    </section>
  );
}
