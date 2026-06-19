# Working together on this hackathon (git for two people)

You said your git experience is "just pushing." That's genuinely enough to start
— here's the small set of extra moves that lets two people work at once without
stepping on each other. Read this once; keep it open during the event.

## The mental model (30 seconds)

- `main` is the branch that always works. You demo from `main`.
- Nobody commits directly to `main`. Each person works on their **own branch**,
  then opens a **Pull Request (PR)** to merge it into `main`.
- A "merge conflict" just means you both edited the same lines. It's normal and
  fixable — see the bottom of this doc.

## One-time setup

**You (repo owner):**
```bash
# from inside this folder
git init
git add -A
git commit -m "Initial hackathon scaffold"
gh repo create hackathon --private --source=. --remote=origin --push
# (gh is already installed. It'll ask you to log in the first time: gh auth login)
```
Then add your friend so they can push:
```bash
gh repo add-collaborator   # OR: on github.com → repo → Settings → Collaborators → add their username
```

**Your friend (once you've shared the repo URL):**
```bash
git clone https://github.com/<your-username>/hackathon.git
cd hackathon
npm install
```

## The daily loop (both of you, every time you work)

```bash
# 1. Start from the latest main
git checkout main
git pull

# 2. Make a branch for what you're about to build
git checkout -b feature/leaderboard      # name it after the task

# 3. ...write code...

# 4. Save your work
git add -A
git commit -m "Add leaderboard sorting"

# 5. Push your branch
git push -u origin feature/leaderboard   # first push of a branch
# (after that, just `git push`)

# 6. Open a PR (opens in browser)
gh pr create --fill --web
```

Your teammate reviews/merges the PR on GitHub (big green "Merge" button).
After it's merged, **both** of you run `git checkout main && git pull` to sync.

> Rule of thumb: **new task = new branch.** Branches are cheap. Don't pile three
> features into one.

## Divide the work so you rarely collide

Conflicts happen when two people edit the same file. Avoid it by splitting along
the folder structure (see README):

- **Person A:** `src/features/gamification/` + `src/pages/Dashboard.jsx`
- **Person B:** `src/features/agents/` + `src/features/mcp/` + their pages

Shared files to coordinate on (ping each other before editing):
- `src/data/mock.js` — add to the bottom; don't reorder.
- `src/services/dataClient.js` — add new methods; don't touch others'.
- `src/App.jsx` — only when adding a route.

## Quick reference

| I want to... | command |
|---|---|
| see what I've changed | `git status` |
| start a new task | `git checkout main && git pull && git checkout -b feature/x` |
| save progress | `git add -A && git commit -m "..."` |
| upload my branch | `git push` (first time: `git push -u origin <branch>`) |
| open a PR | `gh pr create --fill --web` |
| get teammate's merged work | `git checkout main && git pull` |
| see all branches | `git branch -a` |
| throw away my uncommitted changes | `git checkout -- .` |
| who changed this line | `git blame <file>` |

## When you hit a merge conflict

Don't panic — nothing is lost. After a `git pull` or merge, git marks the
clashing spots in the file like this:

```
<<<<<<< HEAD
your version
=======
their version
>>>>>>> main
```

1. Open the file. Decide what the correct final code is (often you keep both).
2. Delete the `<<<<<<<`, `=======`, `>>>>>>>` marker lines.
3. Save, then:
   ```bash
   git add -A
   git commit          # finishes the merge
   ```
VS Code highlights conflicts with "Accept Current / Incoming / Both" buttons —
easiest way to resolve them. When in doubt, resolve it together at one screen.

## Golden rules for a smooth hackathon

1. **Pull before you start, push when you pause.** Small, frequent commits.
2. **Never commit `.env.local`** — it's gitignored on purpose. Share secrets in
   a DM, not in the repo.
3. **Keep `main` working.** Only merge a PR if the app still runs (`npm run dev`).
4. If git gets scary, **stop and resolve it together** rather than force-pushing.
   Avoid `git push --force` unless you both know exactly why.
