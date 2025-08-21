import { describe, it, expect } from 'vitest';
import { UUID_V4_REGEX } from '../utils/regex.js';

describe('UUID_V4_REGEX', () => {
  it('matches valid v4 uuids', () => {
    const ok = '123e4567-e89b-42d3-a456-426614174000';
    expect(UUID_V4_REGEX.test(ok)).toBe(true);
  });

  it('rejects invalid uuids', () => {
    const bad = '123e4567-e89b-12d3-a456-426614174000'; // not v4
    expect(UUID_V4_REGEX.test(bad)).toBe(false);
  });
});
