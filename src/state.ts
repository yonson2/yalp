export type AppState = 'idle' | 'recording' | 'ready' | 'playing' | 'playing-reversed';

export class StateMachine {
  private state: AppState = 'idle';
  private listeners: Array<(s: AppState) => void> = [];

  get current(): AppState {
    return this.state;
  }

  set(next: AppState): void {
    this.state = next;
    for (const listener of this.listeners) listener(next);
  }

  onChange(listener: (s: AppState) => void): void {
    this.listeners.push(listener);
  }
}
