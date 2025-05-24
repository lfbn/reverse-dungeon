import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.image('boss', 'assets/images/boss.png');
        this.load.image('mine', 'assets/images/mine.png');
        this.load.image('hero1', 'assets/images/crab hero.png');
        this.load.image('hero2', 'assets/images/heroleopard.png');
        this.load.image('hero3', 'assets/images/heroigaivota.png');

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

        // Heroes
        this.heroes = [
            {
                sprite: this.physics.add.sprite(150, 150, 'hero1'),
                patrolPoints: [{ x: 150, y: 150 }, { x: 150, y: 450 }],
                patrolIndex: 0,
                state: 'patrol',
                speed: 100,
            },
            {
                sprite: this.physics.add.sprite(650, 450, 'hero2'),
                patrolPoints: [{ x: 650, y: 450 }, { x: 650, y: 150 }],
                patrolIndex: 0,
                state: 'patrol',
                speed: 100,
            }
        ];
        this.heroes.forEach(hero => {
            hero.sprite.setCollideWorldBounds(true)
        });

        // Boss health and score
        this.bossMaxHealth = 5;
        this.bossHealth = this.bossMaxHealth;
        this.score = 0;

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

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Flashing state
        this.bossIsFlashing = false;
        this.bossOriginalColor = 0x3498db;
        this.bossFlashColor = 0xff0000;

        // Overlap detection
        this.heroes.forEach(hero => {
            this.physics.add.overlap(this.boss, hero.sprite, this.handleBossHeroCollision, null, this);
            // Mine-hero overlap
            this.physics.add.overlap(this.bossMines, hero.sprite, (mine, heroSprite) => {
                this.handleMineHeroCollision(mine, heroSprite, hero);
            }, null, this);
        });

        // Create a group of mines (if you want several)
        this.mines = this.physics.add.group();
    }

    update(time, delta) {
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
    }

    handleBossHeroCollision(boss, hero) {
        if (this.bossIsFlashing) return;
        this.bossIsFlashing = true;
        boss.fillColor = this.bossFlashColor;
        // Reduce boss health
        this.bossHealth = Math.max(0, this.bossHealth - 1);
        this.healthText.setText('Health: ' + this.bossHealth);
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
        // Use the mine sprite
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
     * Handle collision between boss mine and hero.
     * @param {Phaser.GameObjects.GameObject} mine
     * @param {Phaser.GameObjects.GameObject} heroSprite
     * @param {Object} hero
     */
    handleMineHeroCollision(mine, heroSprite, hero) {
        mine.destroy();
        // Optional: add hero damage logic here
        // For now, just flash the hero

        heroSprite.fillColor = 0x00ff00;
        this.time.delayedCall(120, () => {
            heroSprite.fillColor = 0xe74c3c;
        });
    }
}