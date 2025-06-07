import Phaser from 'phaser';

export default class Boss extends Phaser.Physics.Arcade.Sprite {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     */
    constructor(scene, x, y) {
        super(scene, x, y, 'boss');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCircle(40);
        this.setCollideWorldBounds(true);
        this.maxHealth = 5;
        this.health = this.maxHealth;
        this.speed = 200;
    }

    move(moveX, moveY) {
        this.body.setVelocity(moveX * this.speed, moveY * this.speed);
    }

    takeDamage(amount = 1) {
        this.health = Math.max(0, this.health - amount);
    }

    heal(amount = 1) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    isDead() {
        return this.health <= 0;
    }
} 