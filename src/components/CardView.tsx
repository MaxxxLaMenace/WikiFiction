import type { CSSProperties } from 'react';
import type { Card, Universe } from '../types';
import { rarityInfo } from '../universes';

interface Props {
  card: Card;
  universe: Universe;
  faceDown?: boolean;
  locked?: boolean;
  isNew?: boolean;
  copies?: number;
  onClick?: () => void;
}

export default function CardView({ card, universe, faceDown, locked, isNew, copies, onClick }: Props) {
  const rarity = rarityInfo(card.rarity);
  const style = { '--rarity': rarity.color } as CSSProperties;

  if (faceDown) {
    return (
      <button type="button" className="card card-back" style={style} onClick={onClick} aria-label="Retourner la carte">
        <span className="card-back-mark">{universe.name}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`card rarity-${card.rarity}${locked ? ' card-locked' : ''}`}
      style={style}
      onClick={onClick}
      aria-label={locked ? 'Carte non obtenue' : card.name}
    >
      <div className="card-art">
        <img src={card.image} alt="" loading="lazy" />
        {isNew && <span className="card-badge">Nouvelle</span>}
        {!!copies && copies > 1 && <span className="card-copies">×{copies}</span>}
      </div>
      <div className="card-info">
        <span className="card-name">{locked ? '???' : card.name}</span>
        <span className="card-meta">
          {universe.typeLabels[card.type] ?? card.type} · <span className="card-rarity">{rarity.label}</span>
        </span>
      </div>
    </button>
  );
}
