const BAR_WIDTH = 4;
const BAR_GAP = 3;
const MIN_BAR = 3;

export class Waveform {
  private ctx: CanvasRenderingContext2D;
  private analyser: AnalyserNode | null = null;
  private timeDomain = new Uint8Array(0);
  private liveBars: number[] = [];
  private takeBars: number[] = [];
  private takeBuffer: AudioBuffer | null = null;
  private playhead: number | null = null;
  private mode: 'live' | 'take' = 'take';
  private color = '#3b5bdb';

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D not supported');
    this.ctx = ctx;
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    if (accent) this.color = accent;
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }

  attachAnalyser(analyser: AnalyserNode): void {
    this.mode = 'live';
    this.analyser = analyser;
    this.timeDomain = new Uint8Array(analyser.fftSize);
    this.liveBars = [];
    this.playhead = null;
  }

  pushLiveBar(): void {
    if (!this.analyser) return;
    this.analyser.getByteTimeDomainData(this.timeDomain);
    let peak = 0;
    for (const v of this.timeDomain) {
      const a = Math.abs(v - 128) / 128;
      if (a > peak) peak = a;
    }
    this.liveBars.push(peak);
    const max = this.maxBars();
    if (this.liveBars.length > max) this.liveBars.splice(0, this.liveBars.length - max);
  }

  showTake(buffer: AudioBuffer): void {
    this.mode = 'take';
    this.analyser = null;
    this.takeBuffer = buffer;
    this.playhead = null;
    this.takeBars = this.computeBars(buffer);
    this.draw();
  }

  setPlayhead(fraction: number | null): void {
    this.playhead = fraction;
    this.draw();
  }

  private maxBars(): number {
    return Math.max(1, Math.floor(this.canvas.clientWidth / (BAR_WIDTH + BAR_GAP)));
  }

  private computeBars(buffer: AudioBuffer): number[] {
    const count = this.maxBars();
    const data = buffer.getChannelData(0);
    const bars = new Array<number>(count).fill(0);
    const bucket = Math.max(1, Math.floor(data.length / count));
    for (let i = 0; i < count; i++) {
      let peak = 0;
      const start = i * bucket;
      const end = Math.min(start + bucket, data.length);
      for (let j = start; j < end; j++) {
        const v = Math.abs(data[j]);
        if (v > peak) peak = v;
      }
      bars[i] = peak;
    }
    return bars;
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    if (this.takeBuffer) this.takeBars = this.computeBars(this.takeBuffer);
    this.draw();
  }

  draw(): void {
    const { width, height } = this.canvas;
    if (width === 0 || height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const c = this.ctx;
    c.clearRect(0, 0, width, height);

    const mid = height / 2;
    const step = (BAR_WIDTH + BAR_GAP) * dpr;
    const barW = BAR_WIDTH * dpr;
    const maxH = height - 8 * dpr;
    const minH = MIN_BAR * dpr;
    const bars = this.mode === 'live' ? this.liveBars : this.takeBars;

    c.fillStyle = this.color;
    if (bars.length === 0) {
      const dot = 2 * dpr;
      for (let x = 0; x < width; x += step) {
        c.beginPath();
        c.roundRect(x, mid - dot / 2, barW * 0.6, dot, dot / 2);
        c.fill();
      }
    } else {
      bars.forEach((v, i) => {
        const h = Math.max(minH, v * maxH);
        c.globalAlpha = 0.45 + 0.55 * Math.min(1, v * 1.6);
        c.beginPath();
        c.roundRect(i * step, mid - h / 2, barW, h, barW / 2);
        c.fill();
      });
      c.globalAlpha = 1;
    }

    if (this.playhead !== null) {
      const x = Math.round(this.playhead * width) + 0.5;
      c.strokeStyle = this.color;
      c.lineWidth = 2 * dpr;
      c.beginPath();
      c.moveTo(x, 6 * dpr);
      c.lineTo(x, height - 6 * dpr);
      c.stroke();
      c.fillStyle = this.color;
      for (const y of [6 * dpr, height - 6 * dpr]) {
        c.beginPath();
        c.arc(x, y, 4 * dpr, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
}
