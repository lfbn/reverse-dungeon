# Reverse Dungeon - Project Documentation

## Overview
Reverse Dungeon is a top-down arcade game where you play as the boss, defending against waves of invading heroes. Your goal is to survive as long as possible, using mines and summoning monsters with unique powers to stop the heroes.

## Main Mechanics
- **Boss (Player):** Move with arrow keys. Place mines (SPACE) and summon monsters (M).
- **Dashboard:** Always visible at the top, shows health, score, available monsters, and controls.
- **Heroes:** Spawn in waves, patrol and chase the boss if close. Each wave increases in difficulty.
- **Monsters:** Summoned by the player, each with a unique power (heal, speed up, slow enemies). Only a limited number can be active at once.
- **Mines:** Placed by the boss, explode on contact with heroes.
- **Game Over:** When the boss's health reaches zero.

## File Structure
- `src/js/main.js` — Phaser game configuration (canvas size, scene, physics).
- `src/js/scenes/MainScene.js` — Main game logic: boss, heroes, monsters, UI, controls, wave system.
- `assets/images/` — Sprites for boss, heroes, monsters, mines, and effects.
- `.docs/flow.md` — Mermaid diagram of the game flow.
- `.docs/faq.md` — FAQ for common customizations.
- `.docs/doc.md` — This documentation.

## How to Customize
- **Add monsters:** Edit `monsterTypes` and implement new powers in `MainScene.js`.
- **Change controls/UI:** Edit the `create()` method in `MainScene.js`.
- **Adjust difficulty:** Change wave logic in `spawnWave()`.
- **Change graphics:** Replace/add images in `assets/images/` and update keys.
- **Change play area:** Adjust `gameAreaTop` and canvas height.

## Extending the Game
- Add new hero or monster types with unique behaviors.
- Implement new powers or traps.
- Add new UI elements or effects.
- Integrate sound or music.

For more details, see the FAQ and flowchart in the `.docs` folder.
