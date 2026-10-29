import { useMemo, useState } from 'react';
import type { Card, Rarity, Universe } from '../types';
import { useCardSet, useProgress } from '../storage';
import { RARITIES, RARITY_ORDER } from '../universes';
import CardView from './CardView';
import CardModal from './CardModal';

type Filter = 'all' | 'owned' | 'missing';

export default function Album({ universe }: { universe: Universe }) {
  const cards = useCardSet(universe.id);
  const { progress, reset } = useProgress(universe.id);
  const [type, setType] = useState<string>('all');
  const [rarity, setRarity] = useState<Rarity | 'all'>('all');
  const [filter, setFilter] = useState<Filter>('all');
  const [detail, setDetail] = useState<Card | null>(null);

  const sorted = useMemo(
    () => (cards ? [...cards].sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity] || a.name.localeCompare(b.name)) : []),
    [cards],
  );

  if (!cards) return <p className="loading">Chargement des cartes…</p>;

  const visible = sorted.filter((c) => {
    const owned = !!progress.owned[c.id];
    return (
      (type === 'all' || c.type === type) &&
      (rarity === 'all' || c.rarity === rarity) &&
      (filter === 'all' || (filter === 'owned' ? owned : !owned))
    );
  });
  const types = [...new Set(cards.map((c) => c.type))];

  return (
    <section className="album">
      <div className="album-summary">
        {RARITIES.map((r) => {
          const total = cards.filter((c) => c.rarity === r.id);
          const owned = total.filter((c) => progress.owned[c.id]).length;
          return (
            <span key={r.id} style={{ color: r.color }}>
              {r.label} {owned}/{total.length}
            </span>
          );
        })}
      </div>
      <div className="filters">
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          <option value="all">Tous les types</option>
          {types.map((t) => (
            <option key={t} value={t}>{universe.typeLabels[t] ?? t}</option>
          ))}
        </select>
        <select value={rarity} onChange={(e) => setRarity(e.target.value as Rarity | 'all')} aria-label="Rareté">
          <option value="all">Toutes les raretés</option>
          {RARITIES.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
        <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} aria-label="Possession">
          <option value="all">Toutes les cartes</option>
          <option value="owned">Obtenues</option>
          <option value="missing">Manquantes</option>
        </select>
      </div>
      <div className="card-grid">
        {visible.map((card) => {
          const copies = progress.owned[card.id] ?? 0;
          return (
            <CardView
              key={card.id}
              card={card}
              universe={universe}
              locked={copies === 0}
              copies={copies}
              onClick={copies > 0 ? () => setDetail(card) : undefined}
            />
          );
        })}
      </div>
      {visible.length === 0 && <p className="loading">Aucune carte ne correspond à ces filtres.</p>}
      <button
        type="button"
        className="btn btn-danger"
        onClick={() => confirm(`Effacer toute ta progression dans ${universe.name} ?`) && reset()}
      >
        Réinitialiser la collection
      </button>
      {detail && <CardModal card={detail} universe={universe} copies={progress.owned[detail.id] ?? 0} onClose={() => setDetail(null)} />}
    </section>
  );
}
