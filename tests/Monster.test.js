import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser before importing Monster
vi.mock('phaser', () => {
  class MockSprite {
    constructor(scene, x, y) {
      this.x = x;
      this.y = y;
    }
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

import Monster from '../src/js/entities/Monster';

// Mock Phaser dependencies
const mockScene = {
  add: { existing: vi.fn() },
  physics: { add: { existing: vi.fn() } },
  time: { now: 12345 }
};

const monsterType = { key: 'bloodeye', name: 'Blood Eye' };

describe('Monster Entity', () => {
  let monster;
  beforeEach(() => {
    monster = new Monster(mockScene, 10, 20, monsterType);
  });

  it('should initialize with correct properties', () => {
    expect(monster.x).toBe(10);
    expect(monster.y).toBe(20);
    expect(monster.monsterType).toBe('bloodeye');
    expect(monster.summonTime).toBe(12345);
    expect(monster.duration).toBe(30000);
    expect(monster.timerText).toBe(null);
    expect(monster.powerText).toBe(null);
  });

  it('should have stub methods for applyPower and removePower', () => {
    expect(() => monster.applyPower({})).not.toThrow();
    expect(() => monster.removePower({})).not.toThrow();
  });
}); 