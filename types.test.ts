import { describe, it, expect } from 'vitest';
import { getLevelTitle } from './types';

describe('getLevelTitle', () => {
  it('should return correct title for level 1', () => {
    expect(getLevelTitle(1)).toBe('Эрудит-стажер');
  });

  it('should return correct title for level 4', () => {
    expect(getLevelTitle(4)).toBe('Эрудит-стажер');
  });

  it('should return correct title for level 5', () => {
    expect(getLevelTitle(5)).toBe('Мастер синапсов');
  });

  it('should return correct title for level 9', () => {
    expect(getLevelTitle(9)).toBe('Мастер синапсов');
  });

  it('should return correct title for level 10', () => {
    expect(getLevelTitle(10)).toBe('Профессор логики');
  });

  it('should return correct title for level 19', () => {
    expect(getLevelTitle(19)).toBe('Профессор логики');
  });

  it('should return correct title for level 20', () => {
    expect(getLevelTitle(20)).toBe('Архитектор знаний');
  });

  it('should return correct title for level 49', () => {
    expect(getLevelTitle(49)).toBe('Архитектор знаний');
  });

  it('should return correct title for level 50', () => {
    expect(getLevelTitle(50)).toBe('Нейро-интеллект');
  });

  it('should return correct title for level 100', () => {
    expect(getLevelTitle(100)).toBe('Нейро-интеллект');
  });
});
