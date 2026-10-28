# Street Game

## Play

The game is published at https://rajata07.github.io/street-game/

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the game
(`npm run build`) and publishes `dist/` to GitHub Pages. It can also be run
manually via "Run workflow".

One-time setup: in the repository, go to Settings → Pages and set **Source** to
**GitHub Actions**.

## Development

```
npm ci
npm run dev
npm test
```
