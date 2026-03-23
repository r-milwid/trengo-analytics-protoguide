---
name: self-review
description: Quick pre-commit sanity check for prototype code. Run before committing to catch obvious problems.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash
---

# Prototype Self-Review

Check changed files for the basics that matter even in prototypes.

## Checklist

1. **No secrets in client code** — Grep changed `.js` and `.html` files for API keys, tokens, or credentials. These belong in the Worker's wrangler.toml or Cloudflare secrets.
2. **No broken references** — Skim for function calls or element selectors that reference things that don't exist (renamed/deleted functions, removed DOM elements).
3. **Does it load?** — If a dev server is running, check the browser console for errors. If not, at minimum do a syntax check on changed JS files with `node --check`.

## How to run

1. `git diff --cached --name-only` to find staged files (or `git diff --name-only` for unstaged)
2. Check each item above
3. Report: what's fine, what needs fixing
