# Online duel readiness

The app is ready to be deployed as a static Vite app on GitHub Pages.

Production URL after GitHub Pages deploy:

```text
https://avihai24n-oss.github.io/spanish-game/
```

## What is already ready

- Deterministic rounds by shared seed: two players with the same seed get the same questions.
- A `MatchTransport` abstraction for swapping bot matches with realtime matches.
- End-of-round waiting flow: results show only after both players finish.
- Results screen with score, winner, point gap, correct answers, mistakes, and accuracy.
- GitHub Pages workflow at `.github/workflows/deploy-pages.yml`.

## What is still needed for real online

GitHub Pages is static hosting. It cannot keep realtime room state by itself.

To make friend-vs-friend work online, connect one realtime backend:

- Supabase Realtime
- Firebase Realtime Database / Firestore
- a small WebSocket server
- PartyKit / Cloudflare Durable Objects

## Required realtime protocol

The backend only needs to relay the existing `MatchEvent` messages by `roomId`.

Client sends:

- `roundStart`
- `playerAnswer`
- `playerFinished`

Client receives:

- `opponentAnswer`
- `opponentFinished`

Each room should store:

- `roomId`
- `seed`
- `questionKinds`
- two player ids
- event log or latest answer events

Once the backend exists, implement `src/transport/RealtimeTransport.ts` against it and start the game with that transport instead of `BotTransport`.
