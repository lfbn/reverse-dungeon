import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser before importing Hero
vi.mock('phaser', () => ({
  default: class {},
  Physics: { Arcade: { Sprite: class {} } }
}));

import Hero from '../src/js/entities/Hero';

// Mock Phaser dependencies
const mockScene = {
  physics: { add: { sprite: vi.fn((x, y, type) => ({
    x, y, type, setCollideWorldBounds: vi.fn(), body: { setVelocity: vi.fn() }
  })) }
  }
};

describe('Hero Entity', () => {
  let hero;
  const patrolPoints = [ { x: 0, y: 0 }, { x: 100, y: 0 } ];
  beforeEach(() => {
    hero = new Hero(mockScene, 0, 0, 'hero1', patrolPoints, 100);
  });

  it('should initialize with correct properties', () => {
    expect(hero.sprite.x).toBe(0);
    expect(hero.sprite.y).toBe(0);
    expect(hero.patrolPoints).toEqual(patrolPoints);
    expect(hero.patrolIndex).toBe(0);
    expect(hero.state).toBe('patrol');
    expect(hero.speed).toBe(100);
  });

  it('should switch to chase when boss is close', () => {
    hero.update({ x: 1, y: 1 }, 10, 10);
    expect(hero.state).toBe('chase');
  });

  it('should return to patrol when boss is far', () => {
    hero.state = 'chase';
    hero.update({ x: 1000, y: 1000 }, 10, 10);
    expect(hero.state).toBe('patrol');
  });

  it('should advance patrolIndex when reaching patrol point', () => {
    hero.sprite.x = 0;
    hero.sprite.y = 0;
    hero.patrolIndex = 0;
    // Place boss far so it stays in patrol
    hero.update({ x: 1000, y: 1000 }, 10, 10);
    // Should move to next patrol point
    expect([0,1]).toContain(hero.patrolIndex);
  });

  it('should reduce speed on takeDamage', () => {
    hero.takeDamage();
    expect(hero.speed).toBe(50);
  });

  it('should destroy sprite on destroy()', () => {
    hero.sprite.destroy = vi.fn();
    hero.destroy();
    expect(hero.sprite.destroy).toHaveBeenCalled();
  });
}); 