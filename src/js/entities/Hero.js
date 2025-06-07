import Phaser from 'phaser';

export default class Hero {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {string} type
     * @param {Array<{x:number,y:number}>} patrolPoints
     * @param {number} speed
     */
    constructor(scene, x, y, type, patrolPoints, speed) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, type);
        this.sprite.setCollideWorldBounds(true);
        this.patrolPoints = patrolPoints;
        this.patrolIndex = 0;
        this.state = 'patrol';
        this.speed = speed;
        this._originalSpeed = speed;
    }

    update(bossPos, chaseDistance, loseDistance) {
        const sprite = this.sprite;
        const body = sprite.body;
        const dx = bossPos.x - sprite.x;
        const dy = bossPos.y - sprite.y;
        const distToBoss = Math.sqrt(dx * dx + dy * dy);
        if (this.state === 'patrol') {
            if (distToBoss < chaseDistance) {
                this.state = 'chase';
            } else {
                const target = this.patrolPoints[this.patrolIndex];
                const pdx = target.x - sprite.x;
                const pdy = target.y - sprite.y;
                const distToPoint = Math.sqrt(pdx * pdx + pdy * pdy);
                if (distToPoint < 5) {
                    this.patrolIndex = (this.patrolIndex + 1) % this.patrolPoints.length;
                }
                const angle = Math.atan2(pdy, pdx);
                body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
            }
        } else if (this.state === 'chase') {
            if (distToBoss > loseDistance) {
                this.state = 'patrol';
                body.setVelocity(0, 0);
            } else {
                const angle = Math.atan2(dy, dx);
                body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
            }
        }
    }

    takeDamage(amount = 1) {
        // Placeholder for future health system
        this.speed = 50;
    }

    destroy() {
        this.sprite.destroy();
    }
} 