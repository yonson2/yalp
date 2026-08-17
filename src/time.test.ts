import { describe, expect, it } from 'vitest';
import { formatHMS, formatMS } from './time';

describe('formatHMS', () => {
  it('formats zero', () => {
    expect(formatHMS(0)).toBe('00:00:00');
  });

  it('floors sub-second precision', () => {
    expect(formatHMS(59.9)).toBe('00:00:59');
  });

  it('rolls seconds into minutes', () => {
    expect(formatHMS(61)).toBe('00:01:01');
  });

  it('rolls minutes into hours', () => {
    expect(formatHMS(3600)).toBe('01:00:00');
  });

  it('formats long durations', () => {
    expect(formatHMS(3661)).toBe('01:01:01');
  });

  it('clamps negatives to zero', () => {
    expect(formatHMS(-5)).toBe('00:00:00');
  });
});

describe('formatMS', () => {
  it('formats zero', () => {
    expect(formatMS(0)).toBe('00:00');
  });

  it('formats seconds', () => {
    expect(formatMS(7)).toBe('00:07');
  });

  it('rolls seconds into minutes', () => {
    expect(formatMS(75)).toBe('01:15');
  });

  it('keeps counting minutes past an hour', () => {
    expect(formatMS(3600)).toBe('60:00');
  });

  it('clamps negatives to zero', () => {
    expect(formatMS(-1)).toBe('00:00');
  });
});
