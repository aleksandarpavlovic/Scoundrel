
import { Card, Suit, RankingSystem } from '../types';

export const createDeck = (): Card[] => {
  const suits = [Suit.Hearts, Suit.Diamonds, Suit.Spades, Suit.Clubs];
  const deck: Card[] = [];

  suits.forEach((suit) => {
    // Spades/Clubs = Monsters (2-14)
    // Diamonds = Weapons (2-10)
    // Hearts = Potions (2-10)
    const isMonsterSuit = suit === Suit.Spades || suit === Suit.Clubs;
    const maxRank = isMonsterSuit ? 14 : 10;
    
    for (let rank = 2; rank <= maxRank; rank++) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
      });
    }
  });

  return shuffle(deck);
};

export const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const getRankLabel = (rank: number, system: RankingSystem = RankingSystem.Standard): string => {
  if (rank <= 10) return rank.toString();
  
  if (system === RankingSystem.Standard) {
    if (rank === 11) return 'J';
    if (rank === 12) return 'Q';
    if (rank === 13) return 'K';
    if (rank === 14) return 'A';
  } else {
    // Alternate: A=11, J=12, Q=13, K=14
    if (rank === 11) return 'A';
    if (rank === 12) return 'J';
    if (rank === 13) return 'Q';
    if (rank === 14) return 'K';
  }
  
  return rank.toString();
};

export const getSuitIcon = (suit: Suit): string => {
  switch (suit) {
    case Suit.Hearts: return '♥️';
    case Suit.Diamonds: return '♦️';
    case Suit.Spades: return '♠️';
    case Suit.Clubs: return '♣️';
  }
};

export const isMonster = (card: Card) => card.suit === Suit.Spades || card.suit === Suit.Clubs;
export const isWeapon = (card: Card) => card.suit === Suit.Diamonds;
export const isPotion = (card: Card) => card.suit === Suit.Hearts;

export const getCardImageUrl = (card: Card, rankingSystem: RankingSystem = RankingSystem.Standard): string => {
  // Map suit to code
  const suitCode = {
    [Suit.Hearts]: 'H',
    [Suit.Diamonds]: 'D',
    [Suit.Spades]: 'S',
    [Suit.Clubs]: 'C'
  }[card.suit];

  // Map rank to code based on ranking system
  let rankCode: string;
  if (card.rank <= 9) {
    rankCode = card.rank.toString();
  } else if (card.rank === 10) {
    rankCode = '0'; // 10 is represented as 0
  } else {
    // Face cards (11-14)
    if (rankingSystem === RankingSystem.Standard) {
      // Standard: J=11, Q=12, K=13, A=14
      const faceMap = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
      rankCode = faceMap[card.rank as keyof typeof faceMap];
    } else {
      // Alternate: A=11, J=12, Q=13, K=14
      const faceMap = { 11: 'A', 12: 'J', 13: 'Q', 14: 'K' };
      rankCode = faceMap[card.rank as keyof typeof faceMap];
    }
  }

  return `/cards/${rankCode}${suitCode}.png`;
};

export const getCardBackUrl = (): string => {
  return '/cards/back.png';
};
