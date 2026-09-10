#!/usr/bin/env bash
# Helper de worktrees para rodar tasks em paralelo sem o Conductor.
# Uso:
#   scripts/worktree.sh new TEC-123 [feat/slug]   cria worktree + branch
#   scripts/worktree.sh list                       lista worktrees
#   scripts/worktree.sh rm TEC-123                  remove o worktree
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
WT_DIR="$ROOT/../teca-worktrees"

cmd="${1:-}"
case "$cmd" in
  new)
    task="${2:?informe o ID da task, ex: TEC-123}"
    branch="${3:-feat/${task,,}}"
    mkdir -p "$WT_DIR"
    path="$WT_DIR/$task"
    git fetch origin main
    git worktree add -b "$branch" "$path" origin/main
    ( cd "$path" && cp "$ROOT/.env.local" .env.local 2>/dev/null || true && npm install )
    echo "worktree: $path  (branch $branch)"
    echo "abra outra sessão do Claude Code em $path e rode /implement-task $task"
    ;;
  list)
    git worktree list
    ;;
  rm)
    task="${2:?informe o ID da task}"
    git worktree remove "$WT_DIR/$task" --force
    echo "removido $task"
    ;;
  *)
    echo "uso: scripts/worktree.sh {new <TASK> [branch] | list | rm <TASK>}" >&2
    exit 1
    ;;
esac
