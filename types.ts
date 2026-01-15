
export enum Suit {
  Hearts = 'HEARTS',     // Potions
  Diamonds = 'DIAMONDS', // Weapons
  Spades = 'SPADES',     // Monsters
  Clubs = 'CLUBS'        // Monsters
}

export enum RankingSystem {
  Standard = 'STANDARD',   // J=11, Q=12, K=13, A=14
  Alternate = 'ALTERNATE'  // A=11, J=12, Q=13, K=14
}

export interface Card {
  id: string;
  suit: Suit;
  rank: number; // Numeric strength (2-14)
}

export interface Weapon {
  value: number;
  lastMonsterKilled: number | null;
}

export enum GameState {
  Playing = 'PLAYING',
  Won = 'WON',
  Lost = 'LOST'
}
