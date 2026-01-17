
import React from 'react';
import { Card, RankingSystem } from '../types';
import { getCardImageUrl, getCardBackUrl } from '../utils/deck';

interface CardUIProps {
  card: Card | null;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isHidden?: boolean;
  isInactive?: boolean;
  size?: 'xs' | 'sm' | 'md';
  rankingSystem?: RankingSystem;
}

const CardUI: React.FC<CardUIProps> = ({
  card,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isHidden,
  isInactive,
  size = 'md',
  rankingSystem = RankingSystem.Standard
}) => {
  const sizeClasses = {
    xs: 'w-12 h-18',
    sm: 'w-16 h-24',
    md: 'w-24 h-36'
  }[size];

  if (!card && !isHidden) {
    return (
      <div className={`${sizeClasses} rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-100 dark:bg-slate-800`}>
        <span className="text-slate-400 dark:text-slate-500 text-[10px]">EMPTY</span>
      </div>
    );
  }

  if (isHidden) {
    return (
      <div
        onClick={onClick}
        className={`${sizeClasses} rounded-lg overflow-hidden card-shadow transition-all transform hover:scale-105 ${isInactive ? 'opacity-50 pointer-events-none grayscale' : 'cursor-pointer'}`}
      >
        <img
          src={getCardBackUrl()}
          alt="Card back"
          className="w-full h-full object-contain"
          draggable="false"
        />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`${sizeClasses} rounded-lg overflow-hidden card-shadow transition-all transform hover:-translate-y-2 hover:scale-105 ${isInactive ? 'opacity-70 pointer-events-none grayscale' : 'cursor-pointer'}`}
    >
      <img
        src={getCardImageUrl(card!, rankingSystem)}
        alt={`${card!.rank} of ${card!.suit}`}
        className="w-full h-full object-contain"
        draggable="false"
      />
    </div>
  );
};

export default CardUI;
