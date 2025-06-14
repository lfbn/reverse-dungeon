# PseudoCode

---

## src/js/main.js

// Entry point for the game
INITIALIZE Phaser game configuration (type, width, height, backgroundColor, scene, physics)
CREATE new Phaser.Game with the configuration

---

## src/js/entities/Hero.js

CLASS Hero
    CONSTRUCTOR(scene, x, y, type, patrolPoints, speed)
        CREATE sprite in scene at (x, y) with type
        SET sprite to collide with world bounds
        INITIALIZE patrol points and state
        SET speed and original speed
    METHOD update(bossPos, chaseDistance, loseDistance)
        IF state is 'patrol'
            IF distance to boss < chaseDistance
                SET state to 'chase'
            ELSE
                MOVE towards current patrol point
                IF blocked or close to patrol point
                    ADVANCE to next patrol point
        ELSE IF state is 'chase'
            IF distance to boss > loseDistance
                SET state to 'patrol'
                STOP movement
            ELSE
                MOVE towards boss
    METHOD takeDamage(amount)
        REDUCE speed (placeholder for health system)
    METHOD destroy()
        DESTROY sprite

---

## src/js/entities/Monster.js

CLASS Monster EXTENDS Phaser.Physics.Arcade.Sprite
    CONSTRUCTOR(scene, x, y, monsterType)
        INITIALIZE sprite in scene at (x, y) with monsterType
        SET collide with world bounds and depth
        STORE monsterType, summonTime, duration
        INITIALIZE timerText and powerText
    METHOD applyPower(gameContext)
        // Implement monster power logic
    METHOD removePower(gameContext)
        // Implement logic to revert power

---

## src/js/entities/Boss.js

CLASS Boss EXTENDS Phaser.Physics.Arcade.Sprite
    CONSTRUCTOR(scene, x, y)
        INITIALIZE sprite in scene at (x, y) as 'boss'
        SET circle collider and world bounds
        SET maxHealth, health, speed
    METHOD move(moveX, moveY)
        SET velocity based on moveX, moveY, and speed
    METHOD takeDamage(amount)
        REDUCE health by amount
    METHOD heal(amount)
        INCREASE health by amount (up to maxHealth)
    METHOD isDead()
        RETURN true if health <= 0

---

## src/js/utils/DebugUtils.js

CLASS DebugUtils
    STATIC METHOD dump(value, label)
        LOG label and value to console
    STATIC METHOD dd(value, label)
        CALL dump
        THROW error to halt execution

---

## src/js/scenes/MainScene.js

CLASS MainScene EXTENDS Phaser.Scene
    CONSTRUCTOR()
        INITIALIZE game state variables (wave, heroes, monsters, config)
    METHOD preload()
        LOAD images and spritesheets for boss, heroes, monsters, mines, explosion
        LOAD audio files:
            - 'plantmine' (plant mine sound)
            - 'monstersummon' (monster summon sound)
            - 'death' (death/game over sound)
            - 'explosion_sfx' (explosion sound)
    METHOD create()
        INITIALIZE boss, health, score, UI texts, controls
        CREATE groups for mines, heroes, monsters
        SPAWN first wave
        SETUP input and animations
    METHOD update(time, delta)
        HANDLE boss movement and restrict area
        HANDLE mine placement and monster summoning
        UPDATE heroes AI and restrict area
        UPDATE score and UI
        UPDATE monsters (timers, effects, removal)
        PREVENT mines from entering restricted area
    METHOD handleBossHeroCollision(bossSprite, heroSprite)
        IF boss is not flashing
            REDUCE boss health
            UPDATE health UI
            IF boss is dead
                SHOW game over
            INCREASE score
            FLASH boss sprite
    METHOD shootBossMine()
        CREATE mine at boss position
        ADD to mines group
        DESTROY mine on world bounds
        PLAY 'plantmine' sound
    METHOD spawnWave()
        REMOVE existing heroes
        CALCULATE number and speed of heroes
        SPAWN heroes at positions with patrol points
        SETUP overlaps for collisions
    METHOD removeHero(heroToRemove)
        REMOVE hero from array
        DESTROY hero
        IF all heroes defeated
            INCREMENT wave and spawn next wave
    METHOD handleMineHeroCollision(mine, heroSprite, hero)
        DISABLE mine
        SHOW explosion animation
        PLAY 'explosion_sfx' sound
        APPLY damage to hero
        INCREASE score
        REMOVE hero
    METHOD summonMonster()
        IF monsters available
            SELECT monster type and position
            SPAWN monster
            SHOW timer and power text
            APPLY monster power
            PLAY 'monstersummon' sound
    METHOD getMonstersText()
        RETURN string with available monsters
    METHOD showGameOver()
        PAUSE physics and input
        SHOW game over text
        SET game over state
        PLAY 'death' sound
    METHOD applyMonsterPower(monster)
        APPLY effect based on monster type (e.g., speed up boss, slow heroes, heal boss)
    METHOD removeMonsterPower(monster)
        REVERT effect based on monster type