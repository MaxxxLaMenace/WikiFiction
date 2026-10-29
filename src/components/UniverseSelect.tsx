import type { CSSProperties } from 'react';
import type { Universe } from '../types';
import { UNIVERSES } from '../universes';
import { useCardSet, useProgress } from '../storage';
import { AccountButton } from '../auth';

function UniverseTile({ universe }: { universe: Universe }) {
  const cards = useCardSet(universe.id);
  const { progress } = useProgress(universe.id);
  const owned = cards ? cards.filter((c) => progress.owned[c.id]).length : 0;
  // Les trois cartes les plus rares servent de vitrine.
  const showcase = cards?.slice(0, 3) ?? [];

  return (
    <a
      href={`#/${universe.id}`}
      className="universe-tile"
      style={{ '--accent': universe.theme.accent, '--universe-bg': universe.theme.background } as CSSProperties}
    >
      <div className="universe-tile-art">
        {showcase.map((c, i) => (
          <img key={c.id} src={c.image} alt="" loading="lazy" style={{ '--i': i } as CSSProperties} />
        ))}
      </div>
      <div className="universe-tile-body">
        <h2>{universe.name}</h2>
        <p>{universe.tagline}</p>
        <div className="progress-bar" aria-label={`${owned} cartes sur ${cards?.length ?? '…'}`}>
          <div style={{ width: cards ? `${(owned / cards.length) * 100}%` : 0 }} />
        </div>
        <span className="universe-tile-count">
          {owned} / {cards?.length ?? '…'} cartes · {progress.packs} paquet{progress.packs > 1 ? 's' : ''} dispo
        </span>
      </div>
    </a>
  );
}

export default function UniverseSelect() {
  return (
    <div className="select-screen">
      <div className="select-account">
        <AccountButton />
      </div>
      <header className="select-header">
        <h1>WikiFiction</h1>
        <p>Choisis un univers et commence ta collection.</p>
      </header>
      <div className="universe-grid">
        {UNIVERSES.map((u) => (
          <UniverseTile key={u.id} universe={u} />
        ))}
      </div>
      <footer className="select-footer">
        Cartes générées à partir des wikis Fandom (CC BY-SA). Projet personnel non officiel.
      </footer>
    </div>
  );
}
