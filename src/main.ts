import './styles.css';
import { decodeTake, TakePlayer, type Direction, type Take } from './audio';
import { TakeRecorder } from './recorder';
import { StateMachine } from './state';
import { formatHMS, formatMS } from './time';
import { queryUI, renderState, showError } from './ui';
import { Waveform } from './waveform';

const ui = queryUI();
const machine = new StateMachine();
const recorder = new TakeRecorder();
const waveform = new Waveform(ui.canvas);

let audioCtx: AudioContext | null = null;
let player: TakePlayer | null = null;
let take: Take | null = null;
let recordStart = 0;

function ensureAudio(): { ctx: AudioContext; player: TakePlayer } {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    player = new TakePlayer(audioCtx);
  }
  return { ctx: audioCtx, player: player as TakePlayer };
}

let lastBig = '';
let lastTransport = '';

function setBig(text: string): void {
  if (text === lastBig) return;
  lastBig = text;
  ui.bigTimer.textContent = text;
}

function setTransport(text: string): void {
  if (text === lastTransport) return;
  lastTransport = text;
  ui.timeLabel.textContent = text;
}

function micSupported(): boolean {
  return typeof navigator.mediaDevices?.getUserMedia === 'function';
}

function micErrorMessage(): string {
  return micSupported() ? 'Microphone blocked' : 'Recording not supported';
}

async function startRecording(): Promise<void> {
  const { ctx, player } = ensureAudio();
  await ctx.resume();
  player.stop();
  take = null;
  waveform.setPlayhead(null);
  ui.slider.max = '0';
  ui.slider.value = '0';
  setTransport(`${formatMS(0)} / ${formatMS(0)}`);
  setBig(formatHMS(0));

  let analyser: AnalyserNode;
  try {
    analyser = await recorder.start(ctx);
  } catch {
    machine.set('idle');
    showError(ui, micErrorMessage());
    return;
  }
  waveform.attachAnalyser(analyser);
  recordStart = performance.now();
  machine.set('recording');
}

async function stopRecording(): Promise<void> {
  const blob = await recorder.stop();
  const { ctx } = ensureAudio();
  try {
    take = await decodeTake(ctx, blob);
  } catch {
    machine.set('idle');
    showError(ui, 'Could not read the take');
    return;
  }
  waveform.showTake(take.forward);
  ui.slider.max = String(take.duration);
  ui.slider.value = '0';
  setBig(formatHMS(take.duration));
  setTransport(`${formatMS(0)} / ${formatMS(take.duration)}`);
  machine.set('ready');
}

function startPlayback(direction: Direction, from: number): void {
  if (!take) return;
  const { ctx, player } = ensureAudio();
  void ctx.resume();
  player.play(take, direction, from, () => {
    machine.set('ready');
    waveform.setPlayhead(null);
    ui.slider.value = '0';
    if (!take) return;
    setBig(formatHMS(take.duration));
    setTransport(`${formatMS(0)} / ${formatMS(take.duration)}`);
  });
  machine.set(direction === 'forward' ? 'playing' : 'playing-reversed');
}

function stopPlayback(): void {
  player?.stop();
  machine.set('ready');
  waveform.setPlayhead(null);
  ui.slider.value = '0';
  if (!take) return;
  setBig(formatHMS(take.duration));
  setTransport(`${formatMS(0)} / ${formatMS(take.duration)}`);
}

ui.recordTile.addEventListener('click', () => void startRecording());
ui.transportRecord.addEventListener('click', () => void startRecording());
ui.stopTile.addEventListener('click', () => void stopRecording());

ui.playBtn.addEventListener('click', () => {
  const s = machine.current;
  if (s === 'playing') return stopPlayback();
  if (s === 'playing-reversed' && player) return startPlayback('forward', player.position());
  if (take) startPlayback('forward', 0);
});

ui.playRevBtn.addEventListener('click', () => {
  const s = machine.current;
  if (s === 'playing-reversed') return stopPlayback();
  if (s === 'playing' && player) return startPlayback('reversed', player.position());
  if (take) startPlayback('reversed', take.duration);
});

ui.slider.addEventListener('input', () => {
  const s = machine.current;
  if ((s === 'playing' || s === 'playing-reversed') && player) {
    startPlayback(s === 'playing' ? 'forward' : 'reversed', Number(ui.slider.value));
  }
});

machine.onChange((s) => renderState(ui, s, take !== null));

let lastBarAt = 0;

function tick(now: number): void {
  const s = machine.current;
  if (s === 'recording') {
    setBig(formatHMS((now - recordStart) / 1000));
    if (now - lastBarAt > 50) {
      lastBarAt = now;
      waveform.pushLiveBar();
    }
    waveform.draw();
  } else if ((s === 'playing' || s === 'playing-reversed') && player && take) {
    const pos = player.position();
    setBig(formatHMS(pos));
    setTransport(`${formatMS(pos)} / ${formatMS(take.duration)}`);
    ui.slider.value = String(pos);
    waveform.setPlayhead(take.duration > 0 ? pos / take.duration : 0);
  }
  requestAnimationFrame(tick);
}

if (!micSupported()) {
  ui.recordTile.disabled = true;
  ui.transportRecord.disabled = true;
  showError(ui, 'Recording not supported');
}
renderState(ui, machine.current, false);
requestAnimationFrame(tick);
