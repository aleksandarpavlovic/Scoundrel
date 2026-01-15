
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Weapon, GameState, Suit, RankingSystem } from './types';
import { createDeck, isMonster, isWeapon, isPotion, getSuitIcon } from './utils/deck';
import CardUI from './components/CardUI';

const MAX_HEALTH = 20;

const App: React.FC = () => {
  // Initialize settings from Local Storage or defaults
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('scoundrel-theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  const [rankingSystem, setRankingSystem] = useState<RankingSystem>(() => {
    const saved = localStorage.getItem('scoundrel-ranking');
    return (saved as RankingSystem) || RankingSystem.Standard;
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deck, setDeck] = useState<Card[]>([]);
  const [discard, setDiscard] = useState<Card[]>([]);
  const [room, setRoom] = useState<(Card | null)[]>([null, null, null, null]);
  const [health, setHealth] = useState<number>(MAX_HEALTH);
  const [weapon, setWeapon] = useState<Weapon | null>(null);
  const [weaponCard, setWeaponCard] = useState<Card | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.Playing);
  const [canFlee, setCanFlee] = useState<boolean>(true);
  const [fledLastTurn, setFledLastTurn] = useState<boolean>(false);
  const [potionUsedThisRoom, setPotionUsedThisRoom] = useState<boolean>(false);
  
  const [useBareHands, setUseBareHands] = useState<boolean>(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState<boolean>(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('scoundrel-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('scoundrel-ranking', rankingSystem);
  }, [rankingSystem]);

  const resetGame = useCallback(() => {
    const newDeck = createDeck();
    setDeck(newDeck);
    setDiscard([]);
    setRoom([null, null, null, null]);
    setHealth(MAX_HEALTH);
    setWeapon(null);
    setWeaponCard(null);
    setGameState(GameState.Playing);
    setCanFlee(true);
    setFledLastTurn(false);
    setPotionUsedThisRoom(false);
    setUseBareHands(false);
    setHoveredCardIndex(null);
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const handleDraw = useCallback((forced: boolean = false) => {
    if (deck.length === 0) return;
    const emptySlots = room.filter(c => c === null).length;
    
    // Auto-draw logic
    if (!forced && emptySlots < 3 && room.some(c => c !== null)) return;

    const currentCards = room.filter(c => c !== null) as Card[];
    const needed = 4 - currentCards.length;
    const nextBatch = deck.slice(0, needed);
    const newDeck = deck.slice(needed);

    setRoom([...currentCards, ...nextBatch, ...Array(4 - (currentCards.length + nextBatch.length)).fill(null)]);
    setDeck(newDeck);
    setCanFlee(!fledLastTurn);
    setPotionUsedThisRoom(false);
  }, [deck, room, fledLastTurn]);

  // Auto-refill logic
  useEffect(() => {
    const cardsLeft = room.filter(c => c !== null).length;
    if (cardsLeft <= 1 && deck.length > 0 && gameState === GameState.Playing) {
      handleDraw(true);
    }
  }, [room, deck.length, handleDraw, gameState]);

  // Initial deal
  useEffect(() => {
    if (gameState === GameState.Playing && deck.length > 0 && room.every(c => c === null)) {
      handleDraw();
    }
  }, [deck, room, gameState, handleDraw]);

  const handleFlee = () => {
    if (!canFlee) return;
    const cardsInRoom = room.filter(c => c !== null) as Card[];
    if (cardsInRoom.length < 4) return;

    setDeck(prev => [...prev, ...cardsInRoom]);
    setRoom([null, null, null, null]);
    setCanFlee(false);
    setFledLastTurn(true);
  };

  const checkWinCondition = (currentRoom: (Card | null)[]) => {
    const monstersInDeck = deck.filter(c => isMonster(c)).length;
    const monstersInRoom = currentRoom.filter(c => c !== null && isMonster(c)).length;
    if (monstersInDeck === 0 && monstersInRoom === 0) {
      setGameState(GameState.Won);
    }
  };

  const removeCardFromRoom = (index: number) => {
    const newRoom = [...room];
    newRoom[index] = null;
    setRoom(newRoom);
    checkWinCondition(newRoom);
  };

  const discardCard = (index: number) => {
    const cardToDiscard = room[index];
    if (cardToDiscard) {
      setDiscard(prev => [cardToDiscard, ...prev]);
      removeCardFromRoom(index);
    }
  };

  const handleCardClick = (card: Card, index: number) => {
    if (gameState !== GameState.Playing) return;

    if (isPotion(card)) {
      if (!potionUsedThisRoom) {
        setHealth(prev => Math.min(MAX_HEALTH, prev + card.rank));
        setPotionUsedThisRoom(true);
      }
      discardCard(index);
    } 
    else if (isWeapon(card)) {
      if (weaponCard) {
        setDiscard(prev => [weaponCard, ...prev]);
      }
      setWeapon({ value: card.rank, lastMonsterKilled: null });
      setWeaponCard(card);
      setUseBareHands(false);
      removeCardFromRoom(index);
    } 
    else if (isMonster(card)) {
      const monsterValue = card.rank;
      let damage = 0;

      const effectiveWeaponValue = (weapon && !useBareHands) ? weapon.value : 0;
      const canUseWeapon = weapon && !useBareHands && (weapon.lastMonsterKilled === null || monsterValue < weapon.lastMonsterKilled);

      if (canUseWeapon) {
        damage = Math.max(0, monsterValue - effectiveWeaponValue);
        setWeapon({ ...weapon!, lastMonsterKilled: monsterValue });
      } else {
        damage = monsterValue;
      }

      const newHealth = health - damage;
      if (newHealth <= 0) {
        setHealth(0);
        setGameState(GameState.Lost);
        return; // Don't discard card or process further if player died
      }

      setHealth(newHealth);
      discardCard(index);
    }
    setFledLastTurn(false);
    setHoveredCardIndex(null);
  };

  const healthDeltaPreview = useMemo(() => {
    if (hoveredCardIndex === null) return 0;
    const card = room[hoveredCardIndex];
    if (!card) return 0;

    if (isMonster(card)) {
      const monsterValue = card.rank;
      const effectiveWeaponValue = (weapon && !useBareHands) ? weapon.value : 0;
      const canUseWeapon = weapon && !useBareHands && (weapon.lastMonsterKilled === null || monsterValue < weapon.lastMonsterKilled);
      if (canUseWeapon) {
        return -Math.max(0, monsterValue - effectiveWeaponValue);
      }
      return -monsterValue;
    }

    if (isPotion(card)) {
      if (potionUsedThisRoom) return 0;
      const healAmount = Math.min(MAX_HEALTH - health, card.rank);
      return healAmount;
    }

    return 0;
  }, [hoveredCardIndex, room, weapon, useBareHands, health, potionUsedThisRoom]);

  const previewHealth = Math.max(0, Math.min(MAX_HEALTH, health + healthDeltaPreview));

  const graveyardGroups = useMemo(() => {
    const groups: Record<Suit, Card[]> = {
      [Suit.Hearts]: [],
      [Suit.Diamonds]: [],
      [Suit.Spades]: [],
      [Suit.Clubs]: []
    };
    discard.forEach(card => groups[card.suit].push(card));
    Object.keys(groups).forEach(suit => {
      groups[suit as Suit].sort((a, b) => a.rank - b.rank);
    });
    return groups;
  }, [discard]);

  const handleRankingChange = (system: RankingSystem) => {
    setRankingSystem(system);
    resetGame();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 md:p-8 transition-colors duration-500">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-600 dark:text-amber-500 tracking-tighter drop-shadow-sm">SCOUNDREL</h1>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-[0.3em] font-bold">Survive the Dungeon</p>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-800 transition-all text-xl bg-white/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 shadow-sm"
            title="Settings"
          >
            ⚙️
          </button>
          <button 
            onClick={resetGame}
            className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl border-b-4 border-amber-800 transition-all shadow-lg font-bold text-sm tracking-widest uppercase active:translate-y-1 active:border-b-0"
          >
            New Quest
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">✕</button>
            </div>
            <div className="p-6 flex flex-col gap-8">
              {/* Theme Setting */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-bold">Theme</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Visual style</span>
                </div>
                <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${theme === 'light' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Light
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${theme === 'dark' ? 'bg-slate-700 shadow-sm text-white' : 'text-slate-500 hover:text-slate-400'}`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              {/* Ranking System Setting */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold">Ranking System</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Affects face card values</span>
                  </div>
                  <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
                    <button 
                      onClick={() => handleRankingChange(RankingSystem.Standard)}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${rankingSystem === RankingSystem.Standard ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'}`}
                    >
                      Standard
                    </button>
                    <button 
                      onClick={() => handleRankingChange(RankingSystem.Alternate)}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${rankingSystem === RankingSystem.Alternate ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'}`}
                    >
                      Alternate
                    </button>
                  </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                    <span className="font-bold">Note:</span> Changing ranking will start a <span className="underline">New Quest</span>.
                    <br />
                    {rankingSystem === RankingSystem.Standard 
                      ? "Standard: J=11, Q=12, K=13, Ace is strongest (14)."
                      : "Alternate: Ace is 11, J=12, Q=13, King is strongest (14)."}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-2 rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center gap-12">
        <div className="w-full flex justify-between items-center px-4 md:px-12">
          {/* Draw Deck with Badge */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
               <CardUI 
                card={null} 
                isHidden={true} 
                isInactive={deck.length === 0}
              />
              <div className="absolute -top-2 -right-2 bg-amber-600 dark:bg-amber-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-100 dark:border-slate-900 shadow-md font-bold">
                 {deck.length}
              </div>
            </div>
            <div className="text-slate-500 dark:text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
              Dungeon
            </div>
          </div>

          <div className="flex flex-col items-center">
            <button 
              onClick={handleFlee}
              disabled={!canFlee || room.filter(c => c !== null).length < 4}
              className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${
                canFlee && room.filter(c => c !== null).length === 4
                ? 'bg-amber-600/10 border-amber-600 text-amber-600 dark:border-amber-500 dark:text-amber-500 hover:bg-amber-500/20 cursor-pointer shadow-lg shadow-amber-500/20 scale-110'
                : 'border-slate-300 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-30 grayscale'
              }`}
            >
              <div className="text-2xl font-bold">🏃</div>
            </button>
            <span className="text-[10px] mt-2 text-slate-500 dark:text-slate-500 uppercase tracking-widest font-bold">Flee the Room</span>
          </div>

          {/* Graveyard with Badge */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => discard.length > 0 && setIsDiscardModalOpen(true)}>
              <CardUI card={discard[0] || null} isInactive={discard.length === 0} rankingSystem={rankingSystem} />
              {discard.length > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-100 dark:border-slate-900 shadow-md font-bold">
                  {discard.length}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg">
                <span className="text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-black/60 rounded">Inspect</span>
              </div>
            </div>
            <div className="text-slate-500 dark:text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
              Graveyard
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 items-center justify-center">
          {room.map((card, i) => (
            <div key={i} className="flex justify-center relative">
              <CardUI 
                card={card} 
                onClick={() => card && handleCardClick(card, i)}
                onMouseEnter={() => card && setHoveredCardIndex(i)}
                onMouseLeave={() => setHoveredCardIndex(null)}
                rankingSystem={rankingSystem}
              />
              {card && hoveredCardIndex === i && (
                <div className={`absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl text-[10px] font-bold animate-pulse shadow-xl pointer-events-none border border-white/20 whitespace-nowrap transition-all z-10 ${
                  isMonster(card) ? 'bg-red-600 text-white' : 
                  (isPotion(card) && !potionUsedThisRoom) ? 'bg-green-600 text-white' : 'hidden'
                }`}>
                  {isMonster(card) ? (healthDeltaPreview < 0 ? `${healthDeltaPreview} Vitality` : 'Protected!') : 
                   (isPotion(card) && !potionUsedThisRoom ? `+${healthDeltaPreview} Vitality` : '')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 border-t border-slate-300 dark:border-slate-800 pt-10 pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-baseline px-1">
            <span className="text-red-700 dark:text-red-500 font-bold text-lg uppercase tracking-[0.3em]">Vitality</span>
            <div className="flex items-center gap-3">
              {hoveredCardIndex !== null && healthDeltaPreview !== 0 && (
                <div className="text-xl font-bold text-slate-400 dark:text-slate-600 flex items-center gap-1">
                  <span>{health}</span>
                  <span className="text-xs">→</span>
                </div>
              )}
              <span className={`text-4xl font-bold tracking-tighter ${hoveredCardIndex !== null && healthDeltaPreview !== 0 ? (healthDeltaPreview < 0 ? 'text-red-500' : 'text-green-500') : ''}`}>
                {hoveredCardIndex !== null && healthDeltaPreview !== 0 ? previewHealth : health} <span className="text-lg opacity-40 font-normal">/ {MAX_HEALTH}</span>
              </span>
            </div>
          </div>
          <div className="w-full h-10 bg-slate-300 dark:bg-slate-900/50 rounded-2xl border-2 border-slate-300 dark:border-slate-800 overflow-hidden relative shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-500 rounded-r-xl" 
              style={{ width: `${(health / MAX_HEALTH) * 100}%` }}
            />
            {hoveredCardIndex !== null && healthDeltaPreview !== 0 && (
              <div 
                className={`absolute top-0 h-full animate-pulse transition-all duration-300 ${healthDeltaPreview < 0 ? 'bg-slate-900/40 dark:bg-white/10' : 'bg-green-400/40'}`}
                style={{ 
                  left: `${(Math.min(health, previewHealth) / MAX_HEALTH) * 100}%`,
                  width: `${(Math.abs(healthDeltaPreview) / MAX_HEALTH) * 100}%` 
                }}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 bg-white/50 dark:bg-slate-900/30 p-6 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity">
            <span className="text-9xl">⚔️</span>
          </div>
          
          <div 
            onClick={() => weapon && setUseBareHands(!useBareHands)}
            className={`relative flex items-center justify-center transition-all cursor-pointer ${!weapon ? 'pointer-events-none' : 'hover:scale-110 active:scale-95'}`}
          >
            {weaponCard ? (
              <div className={`${useBareHands ? 'grayscale blur-[1px] opacity-30 scale-90' : 'scale-110'}`}>
                <CardUI card={weaponCard} size="sm" rankingSystem={rankingSystem} />
              </div>
            ) : (
              <div className="w-16 h-24 rounded-2xl bg-slate-300 dark:bg-slate-900 border-2 border-dashed border-slate-400 dark:border-slate-800 flex items-center justify-center text-3xl">
                👊
              </div>
            )}
            
            {weapon && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                <span className="text-[7px] bg-black text-white px-2 py-1 rounded-full uppercase font-bold tracking-widest">
                  Toggle
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-slate-500 dark:text-slate-500 text-[9px] uppercase font-bold tracking-[0.3em] mb-1">Active Tool</div>
            <h3 className={`text-2xl font-bold tracking-tight transition-colors ${useBareHands || !weapon ? 'text-slate-500' : 'text-amber-600 dark:text-amber-500'}`}>
              {useBareHands || !weapon ? 'Bare Hands' : `Equipped Weapon`}
            </h3>
            
            <div className="mt-3 flex flex-col gap-2">
              <div className="text-xs font-bold flex items-center gap-2">
                <span className="text-slate-400 uppercase text-[8px] tracking-widest">Power:</span>
                <span className="text-xl leading-none">{useBareHands || !weapon ? '0' : weapon.value}</span>
              </div>
              
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                {weapon && !useBareHands ? (
                  <div className="flex flex-col gap-2">
                    <span className="opacity-80">Durability: {weapon.lastMonsterKilled ? `Target < ${weapon.lastMonsterKilled}` : 'Full'}</span>
                    <div className="w-full h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                       <div className="h-full bg-amber-500 transition-all duration-700" style={{ width: weapon.lastMonsterKilled ? `${(weapon.lastMonsterKilled / 14) * 100}%` : '100%' }}></div>
                    </div>
                  </div>
                ) : weapon ? (
                  <span className="text-red-700 dark:text-red-500 font-bold uppercase tracking-tighter animate-pulse">Weapon Inactive</span>
                ) : (
                  <span className="opacity-60 italic">Relic required for defense.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isDiscardModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl transition-all animate-in fade-in duration-300" onClick={() => setIsDiscardModalOpen(false)}>
          <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-5xl max-h-[85vh] rounded-[2.5rem] border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-300 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-950/50">
              <div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">The Graveyard</h3>
                <p className="text-[9px] text-slate-500 dark:text-slate-500 uppercase tracking-[0.4em] mt-1 font-bold">Quest History</p>
              </div>
              <button onClick={() => setIsDiscardModalOpen(false)} className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-zinc-400 hover:text-red-500 hover:scale-110 transition-all text-2xl">✕</button>
            </div>
            
            <div className="p-10 overflow-y-auto flex flex-col gap-12 custom-scrollbar bg-white/30 dark:bg-transparent">
              {(Object.entries(graveyardGroups) as [Suit, Card[]][]).map(([suit, cards]) => (
                <div key={suit} className="flex flex-col gap-6">
                  <div className="flex items-center gap-4 border-b border-slate-300 dark:border-slate-800 pb-3">
                    <span className="text-3xl drop-shadow-sm">{getSuitIcon(suit)}</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                      {suit === Suit.Hearts ? 'Spent Potions' : suit === Suit.Diamonds ? 'Used Weapons' : 'Slayed Monsters'}
                    </span>
                    <span className="ml-auto text-[10px] text-slate-500 dark:text-zinc-400 bg-slate-200 dark:bg-zinc-800 px-3 py-1 rounded-full font-bold">{cards.length}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center min-h-[140px] px-2 py-4">
                    {cards.length > 0 ? (
                      <div className="flex items-start">
                        {cards.map((card, idx) => (
                          <div 
                            key={card.id} 
                            className="transition-all hover:-translate-y-8 hover:z-50 cursor-default"
                            style={{ 
                              marginLeft: idx === 0 ? 0 : -45, 
                              zIndex: idx,
                              transform: `translateX(${idx * 4}px)`
                            }}
                          >
                            <CardUI card={card} size="sm" isInactive={false} rankingSystem={rankingSystem} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 italic text-sm py-4">Nothing here yet.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-slate-200/50 dark:bg-slate-950/50 border-t border-slate-300 dark:border-slate-800 text-[10px] text-slate-400 uppercase text-center tracking-[0.6em] font-black">
              Shadows of the Forgotten
            </div>
          </div>
        </div>
      )}

      {gameState !== GameState.Playing && (
        <div className="fixed inset-0 bg-slate-950/95 flex flex-col items-center justify-center z-[100] p-6 backdrop-blur-3xl animate-in fade-in duration-1000">
          <div className="bg-slate-100 dark:bg-slate-900 border-4 border-amber-600/30 p-16 rounded-[3.5rem] shadow-2xl text-center max-w-md w-full animate-in zoom-in-95 duration-500">
            <div className="mb-10 text-8xl">
              {gameState === GameState.Won ? '🏆' : '💀'}
            </div>
            <h2 className={`text-6xl font-black mb-6 tracking-tighter uppercase ${gameState === GameState.Won ? 'text-amber-600 dark:text-amber-500' : 'text-red-700 dark:text-red-600'}`}>
              {gameState === GameState.Won ? 'Triumph' : 'Defeat'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-12 text-lg">
              {gameState === GameState.Won 
                ? 'The dungeon is conquered. Your legend begins.' 
                : 'The shadows have claimed another soul.'}
            </p>
            <button 
              onClick={resetGame}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-6 px-10 rounded-[1.5rem] transition-all border-b-[10px] border-amber-800 shadow-2xl active:translate-y-2 active:border-b-0 uppercase tracking-[0.2em]"
            >
              New Quest
            </button>
          </div>
        </div>
      )}

      {/* Footer with Creator Tribute and Rules Link */}
      <div className="mt-10 mb-4 text-[10px] text-slate-500 dark:text-slate-400 text-center max-w-3xl leading-loose font-bold opacity-70">
        <p className="uppercase tracking-[0.2em]">
          Based on the original design by <span className="text-amber-600 dark:text-amber-500">Zach Gage</span> & <span className="text-amber-600 dark:text-amber-500">Kurt Bieg</span>.
        </p>
        <a 
          href="http://stfj.net/art/2011/Scoundrel.pdf" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-amber-500 dark:hover:text-amber-400 underline decoration-dotted transition-colors tracking-widest"
        >
          READ THE OFFICIAL RULES
        </a>
      </div>
    </div>
  );
};

export default App;
