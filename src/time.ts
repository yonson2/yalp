const pad = (n: number): string => String(n).padStart(2, '0');

export function formatHMS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor(s / 60) % 60;
  return `${pad(h)}:${pad(m)}:${pad(s % 60)}`;
}

export function formatMS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}
