import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser before importing Boss
vi.mock('phaser', () => {
  class MockSprite {
    constructor(scene, x, y) {
      this.x = x;
      this.y = y;
    }
    setCircle() {}
    setCollideWorldBounds() {}
    setDepth() {}
  }
  return {
    default: {
      Physics: {
        Arcade: {
          Sprite: MockSprite
        }
      }
    }
  };
});

import Boss from '../src/js/entities/Boss';

// Mock Phaser dependencies
const mockScene = {
  add: { existing: vi.fn() },
  physics: { add: { existing: vi.fn() } }
};

// Mock body for movement
class MockBody {
  setVelocity(x, y) { this.lastVelocity = { x, y }; }
  setCollideWorldBounds() {}
}

// Patch Boss to use mock body
class TestBoss extends Boss {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.body = new MockBody();
  }
}

describe('Boss Entity', () => {
  let boss;
  beforeEach(() => {
    boss = new TestBoss(mockScene, 100, 200);
  });

  it('should initialize with correct properties', () => {
    expect(boss.x).toBe(100);
    expect(boss.y).toBe(200);
    expect(boss.maxHealth).toBe(5);
    expect(boss.health).toBe(5);
    expect(boss.speed).toBe(200);
  });

  it('should move with correct velocity', () => {
    boss.move(1, -1);
    expect(boss.body.lastVelocity).toEqual({ x: 200, y: -200 });
  });

  it('should take damage and not go below 0', () => {
    boss.takeDamage(2);
    expect(boss.health).toBe(3);
    boss.takeDamage(10);
    expect(boss.health).toBe(0);
  });

  it('should heal and not exceed maxHealth', () => {
    boss.takeDamage(3);
    boss.heal(2);
    expect(boss.health).toBe(4);
    boss.heal(10);
    expect(boss.health).toBe(5);
  });

  it('should report dead state correctly', () => {
    expect(boss.isDead()).toBe(false);
    boss.takeDamage(5);
    expect(boss.isDead()).toBe(true);
  });
}); 