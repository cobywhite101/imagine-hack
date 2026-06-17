# donebro (Windows / PowerShell) — one-word git shortcut: add + commit + push
#
# Use this file if you are on Windows. (Mac users use donebro.zsh instead.)
#
# INSTALL (do this once per machine):
#   1. Open your PowerShell profile:
#          notepad $PROFILE
#      If Notepad asks "Do you want to create a new file?", click YES.
#
#   2. Paste the donebro function below at the bottom, then save and close Notepad.
#
#   3. Reload your profile:
#          . $PROFILE
#
#      If you get a red error about "running scripts is disabled on this system",
#      run this ONE line once, then redo step 3:
#          Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
#
# USE (from inside the repo):
#   donebro                 -> commits ALL your changes with an auto message, then pushes
#   donebro fix badges      -> commits ALL your changes with that message, then pushes
#
# It pushes the branch you're currently on. Check with `git branch` first.

function donebro {
    git rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Not inside a git repository."
        return
    }

    $branch = (git rev-parse --abbrev-ref HEAD).Trim()

    if (git status --porcelain) {
        if ($args.Count -gt 0) {
            $message = $args -join " "
        } else {
            $message = "chore: update ($(Get-Random -Maximum 100000))"
        }
        git add -A
        git commit -m $message
        if ($LASTEXITCODE -ne 0) { return }
    } else {
        Write-Host "No local changes to commit. Pushing current branch only."
    }

    git push origin $branch
}
