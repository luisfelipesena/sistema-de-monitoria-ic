import { describe, expect, it } from 'vitest';

describe('Basic test setup', () => {
  it('should pass a simple test', () => {
    expect(true).toBe(true);
  });

  it('should do basic math correctly', () => {
    expect(1 + 1).toBe(2);
  });
}); 