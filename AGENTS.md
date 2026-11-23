# AGENTS.md

Rules for every AI agent and every human working on the Lezgo website (https://joinlezgo.app). The app's own rules live in `AGENTS.md` in [C5-M3/Lezgo](https://github.com/C5-M3/Lezgo); they do not apply here unless this file says so. `README.md` explains the pages, the deploy and the domain.

## Workflow: no pull requests

This repository does not use pull requests. Work on a branch, check it, then merge it into `main` yourself:

1. Branch from an up-to-date `main`: `git switch main && git pull && git switch -c <type>/<description>` (for example `feature/showroom-redesign`, `fix/join-button`).
2. Commit small steps with [Conventional Commits](https://www.conventionalcommits.org): `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`. Lowercase, imperative, no trailing period.
3. Push the branch. Vercel builds a preview for it; check the preview on a phone and on a computer.
4. Merge into `main` and push. Every push to `main` deploys to production right away:
   ```bash
   git switch main && git pull
   git merge --no-ff <branch>
   git push origin main
   git branch -d <branch> && git push origin --delete <branch>
   ```

Small fixes (a typo, one line of copy) can be committed straight to `main`.

## Before you merge

- Run the site locally (`python3 -m http.server 8791`) and check every changed page at phone width (375 px) and desktop width, in light and dark mode, and with Reduce Motion on.
- No horizontal scrolling at 375 px. Each landing-page section fills one screen below the header.
- The page must still work without JavaScript.

## Assets

- Vercel caches `/assets` for a week. When you change an image, give it a new file name and update the references. Never overwrite an image in place.
- App screenshots come from the app's debug screens on an iPhone 17 Pro simulator, status bar at 9:41, dark mode. The phone frame and Dynamic Island are drawn by CSS, so do not crop a frame or island into the image.
- Load no outside scripts. Libraries are saved in `assets/vendor/`.

## Never commit

`.vercel/`, `.env*` or any token or key.
