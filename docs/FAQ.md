# Frequently Asked Questions (FAQ)

## 1. What is Reverse Dungeon?
Reverse Dungeon is a dungeon defense game where you play as the final boss. Your goal is to survive waves of invading heroes using traps, monsters, and special abilities.

## 2. How do I install and run the game?
1. Make sure you have Node.js installed.
2. In the terminal, navigate to the project folder.
3. Run `npm install` to install dependencies.
4. To play in development mode, run `npm run dev`.
5. To build for production, use `npm run build` and then `npm run preview` to preview.

## 3. What are the game controls?
- **Arrow keys:** Move the boss.
- **Space bar (SPACE):** Place a mine.
- **M key:** Summon an allied monster.

## 4. How do hero waves work?
Each wave brings more heroes and/or faster ones. Heroes patrol and, if they get close to the boss, chase him until they defeat him or are eliminated.

## 5. What do allied monsters do?
Each monster has a temporary special power:
- **Blood Eye:** Periodically heals the boss.
- **Skeleton:** Increases the boss's speed.
- **Spacegoop:** Slows down the heroes.

## 6. What happens when I lose all my health?
The game ends and a "Game Over" screen appears. You can restart by reloading the page.

## 7. The game doesn't start or gives an error. What should I do?
- Check if you have Node.js installed.
- Make sure you ran `npm install` before running the game.
- Check for error messages in the terminal or browser console.
- If the problem persists, check the README or contact the project maintainer.

## 8. Can I modify or expand the game?
Yes! The code is organized by scenes, entities, and utilities. You can easily add new monsters, heroes, or mechanics.

## 9. Who made this game?
The game was developed as a dungeon defense demo project, using Phaser.js and Vite.

## 10. Where can I get help or report bugs?
Check the README for more details or open an issue in the project repository. Alternatively, contact the project maintainer. 