# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Build for production
npm run preview  # Preview production build
```

## Architecture Overview

Scoundrel Solitaire is a React 19 + TypeScript single-page card game built with Vite. The game implements the Scoundrel dungeon-crawling card game rules.

### Project Structure

- `App.tsx` - Main game component containing all game state and logic
- `types.ts` - Core type definitions (Card, Weapon, GameState, Suit, RankingSystem)
- `utils/deck.ts` - Deck creation, shuffling, and card utility functions
- `components/CardUI.tsx` - Reusable card rendering component
- `index.tsx` - React entry point
- `index.html` - HTML entry with Tailwind CDN and custom styles

### Game Domain Model

**Suits map to card types:**
- Hearts = Potions (ranks 2-10, heal player)
- Diamonds = Weapons (ranks 2-10, equippable)
- Spades/Clubs = Monsters (ranks 2-14, deal damage)

**Key game state in App.tsx:**
- `deck` / `room` (4 slots) / `discard` - card locations
- `health` (max 20), `weapon` (value + lastMonsterKilled for durability tracking)
- `canFlee`, `fledLastTurn`, `potionUsedThisRoom` - turn restrictions

### Styling

Uses Tailwind CSS via CDN (`<script src="https://cdn.tailwindcss.com">`) with dark mode support via class strategy. Custom font (MedievalSharp) loaded from Google Fonts. Theme preference persisted to localStorage.

### Path Aliases

`@/*` maps to project root (configured in tsconfig.json and vite.config.ts).
