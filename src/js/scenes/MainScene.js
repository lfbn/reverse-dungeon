import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        // Wave system state
        this.currentWave = 1;
        this.heroesPerWave = 2;
        this.heroSpeedBase = 100;
        this.heroTypes = ['hero1', 'hero2', 'hero3'];
        this.isGameOver = false;
        // Monsters system
        this.monsterTypes = [
            { key: 'bloodeye', name: 'Blood Eye', img: 'assets/images/bloodeye.png' },
            { key: 'esqueleto', name: 'Esqueleto', img: 'assets/images/esqueleto.png' },
            { key: 'spacegoop', name: 'Spacegoop', img: 'assets/images/spacegoop.png' }
        ];
        this.availableMonsters = [ 'bloodeye', 'esqueleto', 'spacegoop' ]; // Start with 3
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
    }

    create() {
        // Boss properties
        this.bossRadius = 40;
        this.bossSpeed = 200;
        this.boss = this.physics.add.sprite(400, 300, 'boss');
        this.boss.body.setCircle(this.bossRadius);
        this.boss.body.setCollideWorldBounds(true);
        this.physics.add.existing(this.boss);
        this.bossMines = this.physics.add.group();
        this.lastShotTime = 0;
        this.shotCooldown = 400;
        this.bossMaxHealth = 5;
        this.bossHealth = this.bossMaxHealth;
        this.score = 0;
        this.lastScoreTick = 0; // Track last time score was incremented by time

        // Heroes array (empty, will be filled by spawnWave)
        this.heroes = [];
        // Monsters group
        this.monsters = this.physics.add.group();
        // Spawn first wave
        this.spawnWave();

        // UI Texts
        this.healthText = this.add.text(16, 16, 'Health: ' + this.bossHealth, {
            font: '20px monospace',
            fill: '#fff',
            backgroundColor: '#222',
            padding: { x: 8, y: 4 }
        }).setScrollFactor(0).setDepth(10);
        this.scoreText = this.add.text(16, 44, 'Score: ' + this.score, {
            font: '20px monospace',
            fill: '#fff',
            backgroundColor: '#222',
            padding: { x: 8, y: 4 }
        }).setScrollFactor(0).setDepth(10);
        // Monsters UI
        this.monstersText = this.add.text(16, 72, this.getMonstersText(), {
            font: '20px monospace',
            fill: '#fff',
            backgroundColor: '#222',
            padding: { x: 8, y: 4 }
        }).setScrollFactor(0).setDepth(10);
        // Controls help
        this.controlsText = this.add.text(16, 100, 'Controls: SPACE - place mine | M - place monster', {
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
        const body = this.boss.body;
        let moveX = 0, moveY = 0;
        if (this.cursors.left.isDown) moveX = -1;
        else if (this.cursors.right.isDown) moveX = 1;
        if (this.cursors.up.isDown) moveY = -1;
        else if (this.cursors.down.isDown) moveY = 1;

        body.setVelocity(moveX * this.bossSpeed, moveY * this.bossSpeed);

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
        const chaseDistance = 250; // distance to start chasing
        const loseDistance = 250;  // distance to get back to patrol

        this.heroes.forEach(hero => {
            const sprite = hero.sprite;
            const body = sprite.body;
            if (!body) return; // Skip if body is missing

            // Calculate distance to the boss
            const dx = bossPos.x - sprite.x;
            const dy = bossPos.y - sprite.y;
            const distToBoss = Math.sqrt(dx * dx + dy * dy);

            if (hero.state === 'patrol') {
                // If the boss is close, change to chase
                if (distToBoss < chaseDistance) {
                    hero.state = 'chase';
                } else {
                    // Patrol between points
                    const target = hero.patrolPoints[hero.patrolIndex];
                    const pdx = target.x - sprite.x;
                    const pdy = target.y - sprite.y;
                    const distToPoint = Math.sqrt(pdx * pdx + pdy * pdy);
                    if (distToPoint < 5) {
                        // Arrived at the point, go to the next
                        hero.patrolIndex = (hero.patrolIndex + 1) % hero.patrolPoints.length;
                    }
                    // Move to the patrol point
                    const angle = Math.atan2(pdy, pdx);
                    body.setVelocity(Math.cos(angle) * hero.speed, Math.sin(angle) * hero.speed);
                }
            } else if (hero.state === 'chase') {
                // If the boss goes away, go back to patrol
                if (distToBoss > loseDistance) {
                    hero.state = 'patrol';
                    body.setVelocity(0, 0);
                } else {
                    // Chase the boss
                    const angle = Math.atan2(dy, dx);
                    body.setVelocity(Math.cos(angle) * hero.speed, Math.sin(angle) * hero.speed);
                }
            }
        });

        if (Phaser.Input.Keyboard.JustDown(this.shootKey)) {
            console.log('Space pressed!');
        }

        // Score: +10 every second
        if (!this.lastScoreTick) this.lastScoreTick = time;
        if (time - this.lastScoreTick >= 1000) {
            const ticks = Math.floor((time - this.lastScoreTick) / 1000);
            this.score += 10 * ticks;
            this.scoreText.setText('Score: ' + this.score);
            this.lastScoreTick += 1000 * ticks;
        }
        this.monstersText.setText(this.getMonstersText());
    }

    handleBossHeroCollision(boss, hero) {
        if (this.bossIsFlashing) return;
        this.bossIsFlashing = true;
        boss.fillColor = this.bossFlashColor;
        // Reduce boss health
        this.bossHealth = Math.max(0, this.bossHealth - 1);
        this.healthText.setText('Health: ' + this.bossHealth);
        if (this.bossHealth === 0) {
            this.showGameOver();
            return;
        }
        // Increase score
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        // Flash for 200 ms, then revert
        this.time.delayedCall(200, () => {
            boss.fillColor = this.bossOriginalColor;
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
    }

    /**
     * Spawn a new wave of heroes, increasing difficulty each wave.
     */
    spawnWave() {
        // Clean up any remaining hero sprites
        if (this.heroes && this.heroes.length > 0) {
            this.heroes.forEach(hero => hero.sprite.destroy());
        }
        this.heroes = [];
        // Calculate number of heroes and speed for this wave
        const numHeroes = this.heroesPerWave + this.currentWave - 1;
        const speed = this.heroSpeedBase + (this.currentWave - 1) * 10;
        for (let i = 0; i < numHeroes; i++) {
            // Pick a hero type in round-robin fashion
            const heroType = this.heroTypes[i % this.heroTypes.length];
            // Spawn at random edge positions
            const spawnPositions = [
                { x: 150, y: 150 },
                { x: 650, y: 450 },
                { x: 150, y: 450 },
                { x: 650, y: 150 }
            ];
            const pos = spawnPositions[i % spawnPositions.length];
            const patrolPoints = [
                pos,
                { x: 800 - pos.x, y: 600 - pos.y }
            ];
            const hero = {
                sprite: this.physics.add.sprite(pos.x, pos.y, heroType),
                patrolPoints,
                patrolIndex: 0,
                state: 'patrol',
                speed: speed,
            };
            hero.sprite.setCollideWorldBounds(true);
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
        // Remove from array
        this.heroes = this.heroes.filter(h => h !== heroToRemove);
        // Destroy sprite
        heroToRemove.sprite.destroy();
        // If all heroes dead, start next wave after short delay
        if (this.heroes.length === 0) {
            this.time.delayedCall(1000, () => {
                this.currentWave++;
                this.spawnWave();
            });
        }
    }

    handleMineHeroCollision(mine, heroSprite, hero) {
        // Garantir que mine é mesmo uma mina
        if (mine.texture && mine.texture.key !== 'mine') {
            // Trocar argumentos se vierem trocados
            [mine, heroSprite] = [heroSprite, mine];
        }
        if (!mine.active || !mine.texture || mine.texture.key !== 'mine') return; // Só atua sobre minas
        mine.disableBody(true, true); // Torna a mina invisível e inativa imediatamente
        this.bossMines.remove(mine, true, true); // Remove do grupo e destrói
        // Show explosion animation at mine position
        const explosion = this.add.sprite(mine.x, mine.y, 'explosion').setDepth(20);
        explosion.setScale(1.2);
        explosion.play('explosion_anim');
        explosion.on('animationcomplete', () => {
            explosion.destroy();
        });
        // Optional: flash the hero to indicate hit
        heroSprite.fillColor = 0x00ff00;
        this.time.delayedCall(120, () => {
            heroSprite.fillColor = 0xe74c3c;
        });
        // Reduce hero speed
        hero.speed = 50;
        // Increase score by 100 for exploding a hero with a mine
        this.score += 100;
        this.scoreText.setText('Score: ' + this.score);
        // Remove hero on hit (for wave system)
        this.removeHero(hero);
    }

    /**
     * Summon a monster if available.
     */
    summonMonster() {
        if (this.availableMonsters.length === 0) return;
        // Remove the first available monster
        const monsterKey = this.availableMonsters.shift();
        // Possíveis posições de spawn
        const positions = [
            { x: 100, y: 100 },
            { x: 700, y: 500 },
            { x: 100, y: 500 },
            { x: 700, y: 100 }
        ];
        // Verifica quais posições estão livres
        const occupied = this.monsters.getChildren().map(m => `${Math.round(m.x)},${Math.round(m.y)}`);
        const freePositions = positions.filter(pos => !occupied.includes(`${pos.x},${pos.y}`));
        if (freePositions.length === 0) {
            // Não há posições livres, devolve o monstro ao array
            this.availableMonsters.unshift(monsterKey);
            return;
        }
        // Escolhe uma posição livre aleatória
        const pos = freePositions[Math.floor(Math.random() * freePositions.length)];
        const monster = this.monsters.create(pos.x, pos.y, monsterKey);
        monster.setCollideWorldBounds(true);
        monster.setDepth(5);
        // Optional: add simple AI or effects here
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
     * Mostra o ecrã de Game Over e pára o jogo.
     */
    showGameOver() {
        // Parar física e input
        this.physics.pause();
        this.input.keyboard.enabled = false;
        this.boss.setTint(0xff0000);

        // Mostrar texto de Game Over
        this.add.text(400, 300, 'GAME OVER', {
            font: '48px monospace',
            fill: '#fff',
            backgroundColor: '#c0392b',
            padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setDepth(100);

        this.isGameOver = true;
    }
}