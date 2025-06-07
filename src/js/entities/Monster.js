import Phaser from 'phaser';

export default class Monster extends Phaser.Physics.Arcade.Sprite {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {object} monsterType
     */
    constructor(scene, x, y, monsterType) {
        super(scene, x, y, monsterType.key);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.setDepth(5);
        this.monsterType = monsterType.key;
        this.summonTime = scene.time.now;
        this.duration = 30000; // 30 seconds
        this.timerText = null;
        this.powerText = null;
    }

    applyPower(gameContext) {
        // Implement power logic based on monsterType
    }

    removePower(gameContext) {
        // Implement logic to revert power
    }
} 