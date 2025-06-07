import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser and entity dependencies
vi.mock('phaser', () => ({
  default: {
    Scene: class {},
    Input: { Keyboard: { KeyCodes: { SPACE: 32, M: 77 }, JustDown: vi.fn() } }
  }
}));
vi.mock('../src/js/entities/Boss', () => ({ default: class {} }));
vi.mock('../src/js/entities/Hero', () => ({ default: class {} }));
vi.mock('../src/js/entities/Monster', () => ({ default: class {} }));

import MainScene from '../src/js/scenes/MainScene';

// Helper to create a new MainScene instance
function createScene() {
  const scene = new MainScene();
  // Mock Phaser.Scene methods used in MainScene
  scene.physics = { add: { group: vi.fn(() => ({ getChildren: () => [] })), overlap: vi.fn() }, pause: vi.fn() };
  scene.add = {
    text: vi.fn(() => {
      const obj = {};
      obj.setScrollFactor = vi.fn(() => obj);
      obj.setDepth = vi.fn(() => obj);
      obj.setOrigin = vi.fn(() => obj);
      obj.setText = vi.fn(() => obj);
      obj.destroy = vi.fn(() => obj);
      obj.setPosition = vi.fn(() => obj);
      return obj;
    })
  };
  scene.input = { keyboard: { createCursorKeys: vi.fn(() => ({})), addKey: vi.fn(() => ({})), enabled: true } };
  scene.time = { delayedCall: vi.fn(), now: 0 };
  scene.anims = { create: vi.fn(), generateFrameNumbers: vi.fn(() => []) };
  scene.load = { image: vi.fn(), spritesheet: vi.fn() };
  scene.boss = { x: 400, y: 375, health: 5, maxHealth: 5, move: vi.fn(), takeDamage: vi.fn(), heal: vi.fn(), isDead: vi.fn(() => false), setTint: vi.fn() };
  scene.bossMines = { getChildren: vi.fn(() => []) };
  scene.heroes = [];
  scene.monsters = [];
  scene.availableMonsters = ['bloodeye', 'esqueleto', 'spacegoop'];
  scene.monsterTypes = [
    { key: 'bloodeye', name: 'Blood Eye', img: 'assets/images/bloodeye.png', power: 'Heals boss +1 every 10s' },
    { key: 'esqueleto', name: 'Esqueleto', img: 'assets/images/esqueleto.png', power: 'Boss speed up' },
    { key: 'spacegoop', name: 'Spacegoop', img: 'assets/images/spacegoop.png', power: 'Slow enemies' }
  ];
  return scene;
}

describe('MainScene', () => {
  it('should initialize with correct default values', () => {
    const scene = new MainScene();
    expect(scene.currentWave).toBe(1);
    expect(scene.heroesPerWave).toBe(1);
    expect(scene.heroSpeedBase).toBe(100);
    expect(scene.heroTypes).toEqual(['hero1', 'hero2', 'hero3']);
    expect(scene.isGameOver).toBe(false);
    expect(scene.availableMonsters).toEqual(['bloodeye', 'esqueleto', 'spacegoop']);
  });

  it('spawnWave should create the correct number of heroes', () => {
    const scene = createScene();
    scene.currentWave = 3;
    scene.heroesPerWave = 2;
    scene.heroTypes = ['hero1', 'hero2'];
    scene.spawnWave();
    expect(scene.heroes.length).toBe(2 + 3 - 1); // heroesPerWave + currentWave - 1
  });

  it('summonMonster should reduce availableMonsters', () => {
    const scene = createScene();
    const initialCount = scene.availableMonsters.length;
    // Mock free position
    scene.monsters = [];
    scene.summonMonster();
    expect(scene.availableMonsters.length).toBe(initialCount - 1);
  });
}); 