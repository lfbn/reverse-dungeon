# FAQ - Customizing the Game

## How do I change the number of heroes per wave?
Edit `src/js/scenes/MainScene.js`, change the value of `this.heroesPerWave` in the constructor.

## How do I add a new monster type?
1. Add a new entry to `this.monsterTypes` in `MainScene.js` with a unique key, name, image path, and power description.
2. Add the image to `assets/images/`.
3. Add the key to `this.availableMonsters` if you want it available from the start.
4. Implement the new power in `applyMonsterPower` and `removeMonsterPower` if needed.

## How do I change the dashboard (UI) position or style?
Edit the positions and styles of the UI texts in the `create()` method of `MainScene.js` (look for `this.healthText`, `this.scoreText`, etc).

## How do I change the area where the game is played?
Adjust the value of `this.gameAreaTop` in `MainScene.js` to set the top limit. Change the canvas height in `src/js/main.js` if you want more or less vertical space.

## How do I change the controls?
Edit the input setup in `create()` in `MainScene.js`. For example, change which key is used for placing mines or summoning monsters.

## How do I change the boss or hero speed?
Edit `this.bossSpeed` or the hero speed logic in `MainScene.js`.

## How do I change the spawn positions of heroes or monsters?
Edit the `spawnPositions` array in `spawnWave()` for heroes and the `positions` array in `summonMonster()` for monsters.

## How do I change the wave progression or difficulty?
Edit the logic in `spawnWave()` to change how many heroes appear and how their speed increases per wave.

## How do I add new powers or effects to monsters?
Add logic to `applyMonsterPower` and `removeMonsterPower` in `MainScene.js` to implement the new effect. Update the monster's `power` description in `monsterTypes`.

## How do I change the graphics or images?
Replace or add new images in `assets/images/` and update the relevant keys in `monsterTypes` or hero types.
