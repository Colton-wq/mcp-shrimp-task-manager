import { describe, it, expect } from 'vitest';

describe('coverage smoke', () => {
  it('should run and count coverage for a trivial function', () => {
    const add = (a: number, b: number) => a + b;
    expect(add(1, 2)).toBe(3);
  });
});
