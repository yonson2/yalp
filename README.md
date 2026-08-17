# yalp

A small voice recorder web app. Record a take, play it back, or play it reversed. The name is "play" backwards.

Everything runs in the browser. Audio is kept in memory only, so a refresh (or a new recording) discards the current take.

## Stack

Vanilla TypeScript + Vite, no framework. Audio is captured with MediaRecorder, and reversed playback works by flipping the decoded PCM samples. The build output is a plain static site.

## Develop

```bash
npm install
npm run dev
```

## Build and test

```bash
npm run build   # outputs dist/
npm test        # unit tests
```
