# donebro — one-word git shortcut: add + commit + push
#
# INSTALL (do this once per machine):
#   1. Open your shell config:   open -e ~/.zshrc
#   2. Paste the donebro() function below at the bottom.
#   3. Reload your shell:        source ~/.zshrc
#
# USE (from inside the repo):
#   donebro                 -> commits ALL your changes with an auto message, then pushes
#   donebro "fix badges"    -> commits ALL your changes with that message, then pushes
#
# It pushes the branch you're currently on. Check with `git branch` first.

donebro() {
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Not inside a git repository."
    return 1
  fi

  local branch message
  branch="$(git rev-parse --abbrev-ref HEAD)"

  if [[ -n "$(git status --porcelain)" ]]; then
    if [[ "$#" -gt 0 ]]; then
      message="$*"
    else
      message="chore: update ($((RANDOM % 100000)))"
    fi
    git add -A && git commit -m "${message}" || return 1
  else
    echo "No local changes to commit. Pushing current branch only."
  fi

  git push origin "${branch}"
}
