import { useEffect, type CSSProperties } from 'react';
import type { Card, Universe } from '../types';
import { rarityInfo } from '../universes';

interface Props {
  card: Card;
  universe: Universe;
  copies: number;
  onClose: () => void;
}

export default function CardModal({ card, universe, copies, onClose }: Props) {
  const rarity = rarityInfo(card.rarity);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal rarity-${card.rarity}`}
        style={{ '--rarity': rarity.color } as CSSProperties}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={card.name}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        <img className="modal-image" src={card.image} alt={card.name} />
        <div className="modal-body">
          <span className="card-meta">
            {universe.typeLabels[card.type] ?? card.type} · <span className="card-rarity">{rarity.label}</span>
          </span>
          <h2>{card.name}</h2>
          <p>{card.summary ?? "Pas de résumé disponible pour cette carte."}</p>
          <div className="modal-footer">
            <span>{copies} exemplaire{copies > 1 ? 's' : ''}</span>
            <a href={card.url} target="_blank" rel="noreferrer">Lire l'article ↗</a>
          </div>
        </div>
      </div>
    </div>
  );
}
