import { describe, expect, it } from 'vitest';
import { reverseSamples } from './reverse';

describe('reverseSamples', () => {
  it('reverses sample order', () => {
    expect([...reverseSamples(new Float32Array([1, 2, 3, 4]))]).toEqual([4, 3, 2, 1]);
  });

  it('handles empty input', () => {
    expect(reverseSamples(new Float32Array(0)).length).toBe(0);
  });

  it('handles a single sample', () => {
    expect([...reverseSamples(new Float32Array([0.5]))]).toEqual([0.5]);
  });

  it('is its own inverse', () => {
    const input = new Float32Array([0.1, -0.2, 0.3, -0.4, 0.5]);
    expect([...reverseSamples(reverseSamples(input))]).toEqual([...input]);
  });

  it('does not mutate the input', () => {
    const input = new Float32Array([1, 2, 3]);
    reverseSamples(input);
    expect([...input]).toEqual([1, 2, 3]);
  });
});
