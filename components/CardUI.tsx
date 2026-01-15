
import React from 'react';
import { Card, Suit, RankingSystem } from '../types';
import { getRankLabel, getSuitIcon } from '../utils/deck';

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
    xs: 'w-12 h-18 p-0.5',
    sm: 'w-16 h-24 p-1',
    md: 'w-24 h-36 p-2'
  }[size];

  const iconSizeClass = {
    xs: 'text-lg',
    sm: 'text-2xl',
    md: 'text-4xl'
  }[size];

  const rankSizeClass = {
    xs: 'text-[8px]',
    sm: 'text-sm',
    md: 'text-xl'
  }[size];

  if (!card && !isHidden) {
    return (
      <div className={`${sizeClasses} rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center`}>
        <span className="text-slate-400 dark:text-slate-500 text-[10px]">EMPTY</span>
      </div>
    );
  }

  if (isHidden) {
    return (
      <div 
        onClick={onClick}
        className={`${sizeClasses} bg-amber-50 dark:bg-slate-700 rounded-lg border-2 border-amber-200 dark:border-slate-600 flex items-center justify-center card-shadow cursor-pointer hover:border-amber-500 transition-all ${isInactive ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="w-full h-full border border-amber-200 dark:border-slate-600 rounded bg-amber-100 dark:bg-slate-800 flex items-center justify-center">
          <div className="text-amber-600 text-3xl">⚔️</div>
        </div>
      </div>
    );
  }

  const isRed = card?.suit === Suit.Hearts || card?.suit === Suit.Diamonds;
  const colorClass = isRed ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200';

  return (
    <div 
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`${sizeClasses} bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-300 dark:border-slate-700 flex flex-col card-shadow transition-all transform hover:-translate-y-1 hover:border-amber-400 cursor-pointer ${isInactive ? 'opacity-70 pointer-events-none' : ''} ${colorClass}`}
    >
      <div className="flex justify-between items-start font-bold">
        <span className={`${rankSizeClass} leading-none`}>{getRankLabel(card!.rank, rankingSystem)}</span>
        <span className={`${rankSizeClass} leading-none`}>{getSuitIcon(card!.suit)}</span>
      </div>
      <div className={`flex-1 flex items-center justify-center ${iconSizeClass}`}>
        {getSuitIcon(card!.suit)}
      </div>
      <div className="flex justify-between items-end rotate-180 font-bold">
        <span className={`${rankSizeClass} leading-none`}>{getRankLabel(card!.rank, rankingSystem)}</span>
        <span className={`${rankSizeClass} leading-none`}>{getSuitIcon(card!.suit)}</span>
      </div>
    </div>
  );
};

export default CardUI;
