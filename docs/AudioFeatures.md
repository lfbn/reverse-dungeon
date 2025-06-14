# Audio Features

This document describes the audio functionality of the Reverse Dungeon game.

## Overview

The game uses sound effects to enhance player feedback and immersion. All audio files are located in the `assets/sounds/` directory.

## Implemented Sound Effects

### 1. Plant Mine
- **File:** `assets/sounds/plantmine.mp3`
- **Description:** Played when the player plants a mine in the dungeon.

### 2. Monster Summon
- **File:** `assets/sounds/monstersummon.mp3`
- **Description:** Played when the player summons a monster.

### 3. Death
- **File:** `assets/sounds/death.mp3`
- **Description:** Played when the boss or a hero dies.

### 4. Explosion
- **File:** `assets/sounds/explosion.mp3`
- **Description:** Played when a mine explodes or an explosion occurs.

## How to Add New Sounds
1. Place the new audio file in the `assets/sounds/` directory.
2. Load the sound in the appropriate scene using Phaser's `this.load.audio` method.
3. Play the sound at the relevant game event using `this.sound.play('key')`.

## Example (Phaser 3)
```js
// Preload
this.load.audio('plantmine', 'assets/sounds/plantmine.mp3');

// Play sound when planting a mine
this.sound.play('plantmine');
```

## Notes
- All sound files should be in `.mp3` format for compatibility.
- Sound effects should be short and provide clear feedback for player actions. 