import Phaser from 'phaser';
import Boss from '../entities/Boss';
import Hero from '../entities/Hero';
import Monster from '../entities/Monster';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');

        // Config
        this.currentWave = 1;
        this.heroesPerWave = 1;
        this.heroSpeedBase = 100;
        this.heroTypes = ['hero1', 'hero2', 'hero3'];
        this.isGameOver = false;

        // Monsters
        this.monsterTypes = [
            { key: 'bloodeye', name: 'Blood Eye', img: 'assets/images/bloodeye.png', power: 'Heals boss +1 every 10s' },
            { key: 'esqueleto', name: 'Esqueleto', img: 'assets/images/esqueleto.png', power: 'Boss speed up' },
            { key: 'spacegoop', name: 'Spacegoop', img: 'assets/images/spacegoop.png', power: 'Slow enemies' }
        ];
        this.availableMonsters = ['bloodeye', 'esqueleto', 'spacegoop']; // Start with 3
    }

    preload() {
        this.load.image('boss', 'assets/images/boss.png');
        this.load.image('mine', 'assets/images/single-mine.png');
        this.load.image('hero1', 'assets/images/crab hero.png');
        this.load.image('hero2', 'assets/images/heroleopard.png');
        this.load.image('hero3', 'assets/images/heroigaivota.png');
        this.load.spritesheet('explosion', 'assets/images/explosion.png', { frameWidth: 64, frameHeight: 64 });
        // Load monster images
        this.monsterTypes.forEach(m => this.load.image(m.key, m.img));
        // Load sound effects
        this.load.audio('plantmine', 'assets/sounds/plantmine.mp3');
        this.load.audio('monstersummon', 'assets/sounds/monstersummon.mp3');
        this.load.audio('death', 'assets/sounds/death.mp3');
        this.load.audio('explosion_sfx', 'assets/sounds/explosion.mp3');
    }

    create() {
        // Boss properties
        this.bossRadius = 40;
        this.bossSpeed = 200;
        this.boss = new Boss(this, 400, 375);
        this.bossMaxHealth = this.boss.maxHealth;
        this.bossHealth = this.boss.health;
        this.score = 0;
        this.lastScoreTick = 0; // Track last time score was incremented by time
        this.gameAreaTop = 140; // Upper limit of the game area

        // Mines group
        this.bossMines = this.physics.add.group();
        this.lastShotTime = 0;
        this.shotCooldown = 400;

        // Heroes array (empty, will be filled by spawnWave)
        this.heroes = [];
        // Monsters array
        this.monsters = [];
        // Spawn first wave
        this.spawnWave();

        // UI Texts
        this.healthText = this.add.text(16, 30, 'Health: ' + this.bossHealth, {
            font: '20px monospace',
            fill: '#fff',
            backgroundColor: '#222',
            padding: { x: 8, y: 4 }
        }).setScrollFactor(0).setDepth(10);
        this.scoreText = this.add.text(16, 60, 'Score: ' + this.score, {
            font: '20px monospace',
            fill: '#fff',
            backgroundColor: '#222',
            padding: { x: 8, y: 4 }
        }).setScrollFactor(0).setDepth(10);
        // Monsters UI
        this.monstersText = this.add.text(16, 90, this.getMonstersText(), {
            font: '20px monospace',
            fill: '#fff',
            backgroundColor: '#222',
            padding: { x: 8, y: 4 }
        }).setScrollFactor(0).setDepth(10);
        // Controls help
        this.controlsText = this.add.text(16, 120, 'Controls: SPACE - place mine | M - place monster', {
            font: '18px monospace',
            fill: '#fff',
            backgroundColor: '#222',
            padding: { x: 8, y: 4 }
        }).setScrollFactor(0).setDepth(10);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.monsterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

        // Flashing state
        this.bossIsFlashing = false;
        this.bossOriginalColor = 0x3498db;
        this.bossFlashColor = 0xff0000;

        // Criar animação de explosão
        this.anims.create({
            key: 'explosion_anim',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 8 }),
            frameRate: 20,
            repeat: 0
        });

        // Overlap detection will be set up in spawnWave
    }

    update(time, delta) {
        if (this.isGameOver) return;
        // Boss movement
        let moveX = 0, moveY = 0;
        if (this.cursors.left.isDown) moveX = -1;
        else if (this.cursors.right.isDown) moveX = 1;
        if (this.cursors.up.isDown) moveY = -1;
        else if (this.cursors.down.isDown) moveY = 1;
        this.boss.move(moveX, moveY);
        // Prevent boss from entering the dashboard area
        if (this.boss.y - this.bossRadius < this.gameAreaTop) {
            this.boss.y = this.gameAreaTop + this.bossRadius;
            this.boss.body.setVelocityY(Math.max(0, this.boss.body.velocity.y));
        }

        // Boss attack: shoot mine
        if (Phaser.Input.Keyboard.JustDown(this.shootKey) && (time - this.lastShotTime > this.shotCooldown)) {
            this.shootBossMine();
            this.lastShotTime = time;
        }
        // Monster summon
        if (Phaser.Input.Keyboard.JustDown(this.monsterKey)) {
            this.summonMonster();
        }

        // Heroes AI
        const bossPos = { x: this.boss.x, y: this.boss.y };
        const chaseDistance = 250;
        const loseDistance = 250;
        this.heroes.forEach(hero => {
            hero.update(bossPos, chaseDistance, loseDistance);
            // Prevent heroes from entering the dashboard area
            if (hero.sprite.y < this.gameAreaTop + 20) {
                hero.sprite.y = this.gameAreaTop + 20;
                hero.sprite.body.setVelocityY(Math.max(0, hero.sprite.body.velocity.y));
            }
        });

        // Score: +10 every second
        if (!this.lastScoreTick) this.lastScoreTick = time;
        if (time - this.lastScoreTick >= 1000) {
            const ticks = Math.floor((time - this.lastScoreTick) / 1000);
            this.score += 10 * ticks;
            this.scoreText.setText('Score: ' + this.score);
            this.lastScoreTick += 1000 * ticks;
        }
        this.monstersText.setText(this.getMonstersText());

        // Update monster timers
        this.monsters.forEach(monster => {
            if (monster.y < this.gameAreaTop + 20) {
                monster.y = this.gameAreaTop + 20;
                if (monster.body) monster.body.setVelocityY(Math.max(0, monster.body.velocity.y));
            }
            if (monster.summonTime !== undefined) {
                const elapsed = time - monster.summonTime;
                const remaining = Math.max(0, 30 - Math.floor(elapsed / 1000));
                if (monster.timerText) {
                    monster.timerText.setText(remaining.toString());
                    monster.timerText.setPosition(monster.x, monster.y - 40);
                }
                if (monster.powerText) {
                    monster.powerText.setPosition(monster.x, monster.y + 40);
                }
                // Blood Eye: heal boss every 10s
                if (monster.monsterType === 'bloodeye' && !monster._lastHeal) {
                    monster._lastHeal = monster.summonTime;
                }
                if (monster.monsterType === 'bloodeye' && time - monster._lastHeal >= 10000) {
                    if (this.boss.health < this.boss.maxHealth) {
                        this.boss.heal(1);
                        this.healthText.setText('Health: ' + this.boss.health);
                    }
                    monster._lastHeal = time;
                }
                if (elapsed >= monster.duration) {
                    if (monster.timerText) monster.timerText.destroy();
                    if (monster.powerText) monster.powerText.destroy();
                    this.removeMonsterPower(monster);
                    this.availableMonsters.push(monster.texture.key);
                    monster.destroy();
                }
            }
        });

        // Prevent mines from entering the dashboard area
        this.bossMines.getChildren().forEach(mine => {
            if (mine.y < this.gameAreaTop + 10) {
                mine.y = this.gameAreaTop + 10;
                if (mine.body) mine.body.setVelocityY(Math.max(0, mine.body.velocity.y));
            }
        });
    }

    handleBossHeroCollision(bossSprite, heroSprite) {
        if (this.bossIsFlashing) return;
        this.bossIsFlashing = true;
        bossSprite.fillColor = this.bossFlashColor;
        // Reduce boss health
        this.boss.takeDamage(1);
        this.healthText.setText('Health: ' + this.boss.health);
        if (this.boss.isDead()) {
            this.showGameOver();
            return;
        }
        // Increase score
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        // Flash for 200 ms, then revert
        this.time.delayedCall(200, () => {
            bossSprite.fillColor = this.bossOriginalColor;
            this.bossIsFlashing = false;
        });
    }

    /**
     * Place a mine from the boss at the current position.
     */
    shootBossMine() {
        const mine = this.physics.add.sprite(this.boss.x, this.boss.y, 'mine');
        mine.body.setCollideWorldBounds(true);
        mine.body.onWorldBounds = true;
        mine.body.setAllowGravity(false);
        mine.body.setBounce(1, 1);

        mine.body.world.on('worldbounds', (body) => {
            if (body.gameObject === mine) {
                mine.destroy();
            }
        });

        this.bossMines.add(mine);
        // Play plant mine sound
        if (this.sound) this.sound.play('plantmine');
    }

    /**
     * Spawn a new wave of heroes, increasing difficulty each wave.
     */
    spawnWave() {
        // Clean up any remaining hero entities
        if (this.heroes && this.heroes.length > 0) {
            this.heroes.forEach(hero => hero.destroy());
        }
        this.heroes = [];
        // Calculate number of heroes and speed for this wave
        const numHeroes = this.heroesPerWave + this.currentWave - 1;
        const speed = this.heroSpeedBase + (this.currentWave - 1) * 10;
        for (let i = 0; i < numHeroes; i++) {
            const heroType = this.heroTypes[i % this.heroTypes.length];
            const spawnPositions = [
                { x: 150, y: 200 },
                { x: 650, y: 650 },
                { x: 150, y: 650 },
                { x: 650, y: 200 }
            ];
            const pos = spawnPositions[i % spawnPositions.length];
            const margin = 40; // Avoid edges
            const patrolPoints = [
                {
                    x: Math.max(margin, Math.min(800 - margin, pos.x)),
                    y: Math.max(margin, Math.min(600 - margin, pos.y))
                },
                {
                    x: Math.max(margin, Math.min(800 - margin, 800 - pos.x)),
                    y: Math.max(margin, Math.min(600 - margin, 750 - pos.y + 100))
                }
            ];
            const hero = new Hero(this, pos.x, pos.y, heroType, patrolPoints, speed);
            this.heroes.push(hero);
        }
        // Set up overlaps for new heroes
        this.heroes.forEach(hero => {
            this.physics.add.overlap(this.boss, hero.sprite, this.handleBossHeroCollision, null, this);
            this.physics.add.overlap(this.bossMines, hero.sprite, (mine, heroSprite) => {
                this.handleMineHeroCollision(mine, heroSprite, hero);
            }, null, this);
        });
    }

    /**
     * Remove hero from array and check for wave clear.
     */
    removeHero(heroToRemove) {
        this.heroes = this.heroes.filter(h => h !== heroToRemove);
        heroToRemove.destroy();
        if (this.heroes.length === 0) {
            this.time.delayedCall(1000, () => {
                this.currentWave++;
                this.spawnWave();
            });
        }
    }

    handleMineHeroCollision(mine, heroSprite, hero) {
        if (mine.texture && mine.texture.key !== 'mine') {
            [mine, heroSprite] = [heroSprite, mine];
        }
        if (!mine.active || !mine.texture || mine.texture.key !== 'mine') return;
        mine.disableBody(true, true);
        this.bossMines.remove(mine, true, true);
        const explosion = this.add.sprite(mine.x, mine.y, 'explosion').setDepth(20);
        explosion.setScale(1.2);
        explosion.play('explosion_anim');
        // Play explosion sound
        if (this.sound) this.sound.play('explosion_sfx');
        explosion.on('animationcomplete', () => {
            explosion.destroy();
        });
        heroSprite.fillColor = 0x00ff00;
        this.time.delayedCall(120, () => {
            heroSprite.fillColor = 0xe74c3c;
        });
        hero.takeDamage(1);
        this.score += 100;
        this.scoreText.setText('Score: ' + this.score);
        this.removeHero(hero);
    }

    /**
     * Summon a monster if available.
     */
    summonMonster() {
        if (this.availableMonsters.length === 0) return;
        const monsterKey = this.availableMonsters.shift();
        const positions = [
            { x: 100, y: 180 },
            { x: 700, y: 600 },
            { x: 100, y: 600 },
            { x: 700, y: 180 }
        ];
        const occupied = this.monsters.map(m => `${Math.round(m.x)},${Math.round(m.y)}`);
        const freePositions = positions.filter(pos => !occupied.includes(`${pos.x},${pos.y}`));
        if (freePositions.length === 0) {
            this.availableMonsters.unshift(monsterKey);
            return;
        }
        const pos = freePositions[Math.floor(Math.random() * freePositions.length)];
        const monsterType = this.monsterTypes.find(mt => mt.key === monsterKey);
        const monster = new Monster(this, pos.x, pos.y, monsterType);
        this.monsters.push(monster);
        monster.summonTime = this.time.now;
        monster.duration = 30000;
        monster.timerText = this.add.text(monster.x, monster.y - 40, '30', {
            font: '18px monospace',
            fill: '#ff0',
            backgroundColor: '#222',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(20);
        monster.powerText = this.add.text(monster.x, monster.y + 40, monsterType.power, {
            font: '13px monospace',
            fill: '#0ff',
            backgroundColor: '#111',
            padding: { x: 2, y: 1 }
        }).setOrigin(0.5).setDepth(20);
        monster.monsterType = monsterType.key;
        this.applyMonsterPower(monster);
        // Play monster summon sound
        if (this.sound) this.sound.play('monstersummon');
    }

    /**
     * Returns a string with the monsters available for summoning.
     */
    getMonstersText() {
        if (this.availableMonsters.length === 0) return 'Monsters: None available';
        const names = this.availableMonsters.map(key => {
            const m = this.monsterTypes.find(mt => mt.key === key);
            return m ? m.name : key;
        });
        return 'Monsters: ' + names.join(', ');
    }

    /**
     * Shows the Game Over screen and stops the game.
     */
    showGameOver() {
        this.physics.pause();
        this.input.keyboard.enabled = false;
        this.boss.setTint(0xff0000);
        this.add.text(400, 300, 'GAME OVER', {
            font: '48px monospace',
            fill: '#fff',
            backgroundColor: '#c0392b',
            padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setDepth(100);
        this.isGameOver = true;
        // Play death sound
        if (this.sound) this.sound.play('death');
    }

    /**
     * Aplica o efeito do poder do monstro.
     */
    applyMonsterPower(monster) {
        if (monster.monsterType === 'esqueleto') {
            if (!this._esqueletoCount) this._esqueletoCount = 0;
            this._esqueletoCount++;
            this.boss.speed += 80;
        } else if (monster.monsterType === 'spacegoop') {
            if (!this._spacegoopCount) this._spacegoopCount = 0;
            this._spacegoopCount++;
            this.heroes.forEach(hero => {
                if (!hero._originalSpeed) hero._originalSpeed = hero.speed;
                hero.speed = Math.max(30, hero.speed - 40);
            });
        }
    }

    /**
     * Reverte o efeito do poder do monstro ao desaparecer.
     */
    removeMonsterPower(monster) {
        if (monster.monsterType === 'esqueleto') {
            if (this._esqueletoCount) this._esqueletoCount--;
            this.boss.speed = Math.max(100, this.boss.speed - 80);
        } else if (monster.monsterType === 'spacegoop') {
            if (this._spacegoopCount) this._spacegoopCount--;
            if (!this._spacegoopCount) {
                this.heroes.forEach(hero => {
                    if (hero._originalSpeed) hero.speed = hero._originalSpeed;
                });
            }
        }
    }
}