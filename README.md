# Orbital Run

A static Three.js runner for Start.ng. Each player runs as their Start.ng
character: the avatar's body shape, clothing colors, skin, hair, hat, and
accessory are built from the style returned by Start.ng.

## Play locally

```sh
npm install
npm run dev
```

For a local-only preview using a clearly labeled sample character, open the Vite
URL with `?preview=1` (for example, `http://localhost:5173/?preview=1`). The
preview mode is excluded from production builds. Start.ng's connect page only
responds when the game is hosted at a `*.start.ng` address.

## Build

```sh
npm run build
```

The ready-to-play static game is generated in `dist/`. Start.ng can host that
folder directly from a public GitHub repository.

To publish, push this project to a public GitHub repository, then send its URL
to Start.ng's `POST https://api.start.ng/games/check` endpoint with a game
`name`. Fix any reported errors before submitting the same repository to
`POST https://api.start.ng/games/publish`. First-time publishing returns an
approval link that must be opened by the game owner while signed in to Start.ng.

## Start.ng integration

The game loads `https://start.ng/connect` in a hidden iframe and requests
`startng:whoami`. It verifies the reply's origin, iframe source, and request ID
before using the returned `user` or `guest`. It refreshes the player after
returning to the tab, so changes to the Start.ng character are reflected in the
game. The sign-in button sends guests back through Start.ng and returns them to
the game.

No account tokens, passwords, API keys, or email addresses are collected or
stored by the game. A local personal best is kept in the browser.

## Controls

- Left/right arrow keys or **A**/**D**: change lanes.
- **Space**: start or restart.
- Touch the on-screen arrow buttons on mobile.
