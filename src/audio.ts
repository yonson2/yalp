import { reverseAudioBuffer } from './reverse';

export type Direction = 'forward' | 'reversed';

export interface Take {
  forward: AudioBuffer;
  reversed: AudioBuffer;
  duration: number;
}

export async function decodeTake(ctx: BaseAudioContext, blob: Blob): Promise<Take> {
  const data = await blob.arrayBuffer();
  const forward = await ctx.decodeAudioData(data);
  return { forward, reversed: reverseAudioBuffer(ctx, forward), duration: forward.duration };
}

export class TakePlayer {
  private source: AudioBufferSourceNode | null = null;
  private startedAt = 0;
  private startPosition = 0;
  private direction: Direction = 'forward';
  private duration = 0;

  constructor(private ctx: AudioContext) {}

  get playing(): boolean {
    return this.source !== null;
  }

  position(): number {
    if (!this.source) return this.startPosition;
    const elapsed = this.ctx.currentTime - this.startedAt;
    const pos =
      this.direction === 'forward' ? this.startPosition + elapsed : this.startPosition - elapsed;
    return Math.min(Math.max(pos, 0), this.duration);
  }

  play(take: Take, direction: Direction, fromPosition: number, onEnded: () => void): void {
    this.stop();
    this.duration = take.duration;
    this.direction = direction;
    this.startPosition = Math.min(Math.max(fromPosition, 0), take.duration);

    const source = this.ctx.createBufferSource();
    source.buffer = direction === 'forward' ? take.forward : take.reversed;
    source.connect(this.ctx.destination);
    source.addEventListener('ended', () => {
      if (this.source !== source) return;
      this.source = null;
      onEnded();
    });

    const rawOffset = direction === 'forward' ? this.startPosition : take.duration - this.startPosition;
    const maxOffset = Math.max(take.duration - 0.001, 0);
    source.start(0, Math.min(Math.max(rawOffset, 0), maxOffset));
    this.startedAt = this.ctx.currentTime;
    this.source = source;
  }

  stop(): void {
    const source = this.source;
    this.source = null;
    if (source) {
      source.stop();
      source.disconnect();
    }
  }
}
