import type { AppState } from './state';

export interface UI {
  statusDot: HTMLElement;
  statusText: HTMLElement;
  bigTimer: HTMLElement;
  subtitle: HTMLElement;
  recordTile: HTMLButtonElement;
  stopTile: HTMLButtonElement;
  waveDot: HTMLElement;
  waveStatusText: HTMLElement;
  canvas: HTMLCanvasElement;
  transportRecord: HTMLButtonElement;
  playBtn: HTMLButtonElement;
  playRevBtn: HTMLButtonElement;
  timeLabel: HTMLElement;
  slider: HTMLInputElement;
}

export function queryUI(): UI {
  const get = <T extends HTMLElement>(id: string): T => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`#${id} missing from DOM`);
    return el as T;
  };
  return {
    statusDot: get('statusDot'),
    statusText: get('statusText'),
    bigTimer: get('bigTimer'),
    subtitle: get('subtitle'),
    recordTile: get('recordTile'),
    stopTile: get('stopTile'),
    waveDot: get('waveDot'),
    waveStatusText: get('waveStatusText'),
    canvas: get('waveCanvas'),
    transportRecord: get('transportRecord'),
    playBtn: get('playBtn'),
    playRevBtn: get('playRevBtn'),
    timeLabel: get('timeLabel'),
    slider: get('seekSlider'),
  };
}

const PILL_DOT: Record<AppState, string> = {
  idle: 'green',
  recording: 'red',
  ready: 'green',
  playing: 'blue',
  'playing-reversed': 'blue',
};

const PILL_TEXT: Record<AppState, string> = {
  idle: 'Ready to record',
  recording: 'Recording',
  ready: 'Ready to play',
  playing: 'Playing',
  'playing-reversed': 'Playing reversed',
};

const WAVE_TEXT: Record<AppState, string> = {
  idle: 'Idle',
  recording: 'Recording',
  ready: 'Ready',
  playing: 'Playing',
  'playing-reversed': 'Playing reversed',
};

export function renderState(ui: UI, state: AppState, hasTake: boolean): void {
  ui.statusDot.className = `dot dot-${PILL_DOT[state]}`;
  ui.statusText.textContent = PILL_TEXT[state];
  ui.subtitle.textContent = PILL_TEXT[state];
  ui.waveDot.className = `dot dot-${state === 'recording' ? 'red' : 'blue'}`;
  ui.waveStatusText.textContent = WAVE_TEXT[state];

  const recording = state === 'recording';
  ui.recordTile.disabled = recording;
  ui.transportRecord.disabled = recording;
  ui.stopTile.disabled = !recording;

  const canPlay = hasTake && !recording;
  ui.playBtn.disabled = !canPlay;
  ui.playRevBtn.disabled = !canPlay;
  setToggle(ui.playBtn, state === 'playing');
  setToggle(ui.playRevBtn, state === 'playing-reversed');

  ui.slider.disabled = !(state === 'playing' || state === 'playing-reversed');
}

function setToggle(btn: HTMLButtonElement, active: boolean): void {
  btn.querySelector('.icon-play')?.classList.toggle('hidden', active);
  btn.querySelector('.icon-stop')?.classList.toggle('hidden', !active);
  const label = btn.querySelector('.btn-label');
  if (label) label.textContent = active ? 'Stop' : (btn.dataset.label ?? '');
}

export function showError(ui: UI, message: string): void {
  ui.statusDot.className = 'dot dot-red';
  ui.statusText.textContent = message;
  ui.subtitle.textContent = message;
}
