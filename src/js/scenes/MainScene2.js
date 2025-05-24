import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        // Load needed images
        this.load.image('boss', 'assets/images/boss.png');
        this.load.image('hero1', 'assets/images/hero1.png');
        this.load.image('hero2', 'assets/images/hero2.png');
        this.load.image('mine', 'assets/images/mine.png');
    }

    create() {

        // Boss
        this.bossRadius = 80;
        this.bossSpeed = 200;
        this.boss = this.physics.add.sprite(400, 300, 'boss');
        this.boss.body.setCircle(this.bossRadius);
        this.boss.body.setCollideWorldBounds(true);
        this.physics.add.existing(this.boss);
        this.bossProjectiles = this.physics.add.group();
        this.lastShotTime = 0;
        this.shotCoolDown = 400;
        this.bossMaxHealth = 5;
        this.bossHealth = this.bossMaxHealth;
        this.score = 0;

        // Heroes
        this.heroes = [
            {
                sprite: this.physics.add.sprite(150, 150, 'hero1'),
                patrolPoints: [ {x: 150, y: 150}, {x: 150, y: 450} ],
                patrolIndex: 0,
                state: 'patrol',
                speed: 100,
            },
            {
                sprite: this.physics.add.sprite(650, 450, 'hero2'),
                patrolPoints: [ {x: 650, y: 450}, {x: 650, y: 150} ],
                patrolIndex: 0,
                state: 'patrol',
                speed: 100,
            }
        ];
        this.heroes.forEach(hero => {
            hero.sprite.body.setCollideWorldBounds(true);
        });

        // Dashboard
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
            // Projectile-hero overlap
            this.physics.add.overlap(this.bossProjectiles, hero.sprite, (projectile, heroSprite) => {
                this.handleProjectileHeroCollision(projectile, heroSprite, hero);
            }, null, this);
        });

        this.mines = this.physics.add.group();
        this.mines.create(400, 500, 'mine');

        // TODO: mina não funciona.
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

        // Boss attack: shoot projectile
        if (Phaser.Input.Keyboard.JustDown(this.shootKey) && (time - this.lastShotTime > this.shotCooldown)) {
            this.shootBossProjectile();
            this.lastShotTime = time;
        }

        // Heroes AI
        const bossPos = { x: this.boss.x, y: this.boss.y };
        const chaseDistance = 180; // distance to start chasing
        const loseDistance = 250;  // distance to get back to patrol

        this.heroes.forEach(hero => {
            const sprite = hero.sprite;
            const body = sprite.body;
            if (!body) return; // Skip if body is missing

            // Place distance to the boss
            const dx = bossPos.x - sprite.x;
            const dy = bossPos.y - sprite.y;
            const distToBoss = Math.sqrt(dx*dx + dy*dy);

            if (hero.state === 'patrol') {
                // If the boos is close change to chase
                if (distToBoss < chaseDistance) {
                    hero.state = 'chase';
                } else {
                    // Patrol between points
                    const target = hero.patrolPoints[hero.patrolIndex];
                    const pdx = target.x - sprite.x;
                    const pdy = target.y - sprite.y;
                    const distToPoint = Math.sqrt(pdx*pdx + pdy*pdy);
                    if (distToPoint < 5) {
                        // Chegou ao ponto, passar ao próximo
                        hero.patrolIndex = (hero.patrolIndex + 1) % hero.patrolPoints.length;
                    }
                    // Move to the patrol pointMover para o ponto de patrulha
                    const angle = Math.atan2(pdy, pdx);
                    body.setVelocity(Math.cos(angle) * hero.speed, Math.sin(angle) * hero.speed);
                }
            } else if (hero.state === 'chase') {
                // If the boss go away go back to patrol
                if (distToBoss > loseDistance) {
                    hero.state = 'patrol';
                    body.setVelocity(0, 0);
                } else {
                    // Perseguir o boss
                    const angle = Math.atan2(dy, dx);
                    body.setVelocity(Math.cos(angle) * hero.speed, Math.sin(angle) * hero.speed);
                }
            }
        });

    }

    handleBossHeroCollision(boss, hero) {
        if (this.bossIsFlashing) return;
        this.bossIsFlashing = true;
        boss.fillColor = this.bossFlashColor;
        // Reduzir vida do boss
        this.bossHealth = Math.max(0, this.bossHealth - 1);
        this.healthText.setText('Vida: ' + this.bossHealth);
        // Aumentar pontuação
        this.score += 10;
        this.scoreText.setText('Pontuação: ' + this.score);
        // Flash for 200 ms, then revert
        this.time.delayedCall(200, () => {
            boss.fillColor = this.bossOriginalColor;
            this.bossIsFlashing = false;
        });
    }

    /**
     * Shoot a projectile from the boss in the direction of movement or up if idle.
     */
    shootBossProjectile() {
        const projectile = this.add.rectangle(this.boss.x, this.boss.y, 16, 16, 0xffff00);
        this.physics.add.existing(projectile, false); // false => corpo dinâmico
        projectile.body.setVelocity(vx, vy);
        projectile.body.setCollideWorldBounds(true);
        projectile.body.onWorldBounds = true;
        projectile.body.setAllowGravity(false);
        projectile.body.setBounce(1, 1);

        projectile.body.world.on('worldbounds', (body) => {
            if (body.gameObject === projectile) {
                projectile.destroy();
            }
        });

        this.bossProjectiles.add(projectile);
        console.log('Projectile:', projectile, 'Velocity:', projectile.body.velocity);
    }

    /**
     * Handle collision between boss projectile and hero.
     * @param {Phaser.GameObjects.GameObject} projectile
     * @param {Phaser.GameObjects.GameObject} heroSprite
     * @param {Object} hero
     */
    handleProjectileHeroCollision(projectile, heroSprite, hero) {
        projectile.destroy();
        // Optional: add hero damage logic here
        // For now, just flash the hero
        heroSprite.fillColor = 0x00ff00;
        this.time.delayedCall(120, () => {
            heroSprite.fillColor = 0xe74c3c;
        });
    }
}
