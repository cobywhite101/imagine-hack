# Git cheat sheet (for Ferdinand & Adrian)

Quick reference for the hackathon. For the full explanation, see [COLLAB.md](COLLAB.md).

## The daily loop

```bash
# 1. Start fresh from main
git checkout main
git pull

# 2. Make a branch for your task
git checkout -b my-feature

# 3. ...write code...

# 4. Save it
git add -A
git commit -m "Describe what you did"

# 5. Push it
git push -u origin my-feature      # first push of a new branch
# (after that, just: git push)
```

## Merge your branch into main

```bash
# After your branch is pushed:
gh pr create --fill --web          # opens browser → "Create PR" → "Merge"

# Then sync your local main:
git checkout main
git pull
```

Terminal-only version (no browser):
```bash
gh pr create --fill
gh pr merge --merge
git checkout main && git pull
```

## Avoiding clashes with each other

- **New feature = new file** whenever possible (e.g. `AdrianBadges.jsx`). New files NEVER clash.
- **In shared files** (`src/data/mock.js`, `src/services/dataClient.js`, `src/App.jsx`,
  `src/pages/Dashboard.jsx`) → **add, don't reorder**. Ping each other before big edits.
- **Merge often.** Push small changes frequently so branches don't drift far apart.
- After anyone merges a PR, **both** run `git checkout main && git pull`.

## Quick reference table

| I want to... | command |
|---|---|
| see what I've changed | `git status` |
| see which branch I'm on | `git branch` (mine has a `*`) |
| start a new task | `git checkout main && git pull && git checkout -b my-feature` |
| save progress | `git add -A && git commit -m "..."` |
| upload my branch | `git push` (first time: `git push -u origin my-feature`) |
| open a PR | `gh pr create --fill --web` |
| get teammate's merged work | `git checkout main && git pull` |
| switch to an existing branch | `git checkout branch-name` |
| throw away uncommitted changes | `git checkout -- .` |

## If you hit a merge conflict

Git marks the clashing lines like this:
```
<<<<<<< HEAD
your version
=======
their version
>>>>>>> main
```
1. Open the file, decide the correct final code (often keep both).
2. Delete the `<<<<<<<`, `=======`, `>>>>>>>` marker lines.
3. `git add -A && git commit`

VS Code shows "Accept Current / Incoming / Both" buttons — easiest way. When unsure, resolve it together at one screen.

## Golden rules

1. **Pull before you start, push when you pause.**
2. **Never commit `.env.local`** — share secrets in a DM, not the repo.
3. **Keep `main` working** — only merge if the app still runs (`npm run dev`).
4. If git gets scary, **stop and fix it together**. Avoid `git push --force`.
