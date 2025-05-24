import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.image('boss', 'assets/boss.png');
    }

    create() {
        // Boss properties
        this.bossRadius = 30;
        this.bossSpeed = 200;
        this.boss = this.physics.add.sprite(400, 300, 'boss');
        this.boss.setCircle(this.bossRadius);
        this.boss.setCollideWorldBounds(true);

        // Heroes (red rectangles)
        this.hero1 = this.add.rectangle(150, 150, 40, 60, 0xe74c3c);
        this.hero2 = this.add.rectangle(650, 450, 40, 60, 0xe74c3c);
        this.physics.add.existing(this.hero1);
        this.physics.add.existing(this.hero2);
        this.hero1.body.setImmovable(true);
        this.hero2.body.setImmovable(true);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();

        // Flashing state
        this.bossIsFlashing = false;
        this.bossOriginalTint = 0xffffff;
        this.bossFlashTint = 0xff0000;

        // Overlap detection
        this.physics.add.overlap(this.boss, this.hero1, this.handleBossHeroCollision, null, this);
        this.physics.add.overlap(this.boss, this.hero2, this.handleBossHeroCollision, null, this);

        this.lastDirection = { x: 0, y: -1 }; // Default: up
    }

    handleBossHeroCollision(boss, hero) {
        if (this.bossIsFlashing) return;
        this.bossIsFlashing = true;
        boss.setTint(this.bossFlashTint);
        // Flash for 200 ms, then revert
        this.time.delayedCall(200, () => {
            boss.clearTint();
            this.bossIsFlashing = false;
        });
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

        // Update last direction if moving
        if (moveX !== 0 || moveY !== 0) {
            this.lastDirection = { x: moveX, y: moveY };
        }

        // Boss attack: shoot projectile
        if (Phaser.Input.Keyboard.JustDown(this.shootKey) && (time - this.lastShotTime > this.shotCooldown)) {
            this.shootBossProjectile();
            this.lastShotTime = time;
        }
    }

    shootBossProjectile() {
        // Use last direction for projectile
        let vx = this.lastDirection.x * 400;
        let vy = this.lastDirection.y * 400;
        // If both are zero, default up
        if (vx === 0 && vy === 0) vy = -400;
        console.log('Disparo:', this.lastDirection, 'vx:', vx, 'vy:', vy);

        // Create projectile (small circle)
        const projectile = this.add.circle(this.boss.x, this.boss.y, 8, 0xffff00);
        this.physics.add.existing(projectile);
        projectile.body.setCircle(8);
        projectile.body.setVelocity(vx, vy);
        projectile.body.setCollideWorldBounds(true);
        projectile.body.setCollideWorldBounds(true);
        projectile.body.onWorldBounds = true;
        projectile.body.world.on('worldbounds', (body) => {
            if (body.gameObject === projectile) {
                projectile.destroy();
            }
        });
        this.bossProjectiles.add(projectile);
    }
} 