# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

One deliverable: **`opencode-lab.html`** — a self-contained enterprise learning portal
(~4,500 lines) that teaches an AI-assisted development workflow with OpenCode. It is a
single file by requirement: no build step, no package manager, no framework, no CDN, no
external fonts or images. It must open and work fully from `file://` on an air-gapped
machine.

The full product specification lives at **`.claude/INSTRUCTIONS.md`** — chapter list,
required pedagogy slots, interactive features, scoring, quizzes, templates, certificate.
Read it before adding or changing content; it is the contract this file implements.

A sibling file, **`opencode-lab-express.html`**, is a 60-minute condensed lab (7 modules,
one tic-tac-toe build) sharing this file's contracts — block renderer, `esc`/`md`, and the
Store/Scorer/Router/Quiz shape — with its own `opencode-express-v1` storage key and no
search region. It is not a version of the full lab; a change to one is not a change to the
other. Its `Scorer` differs in one respect: `rawScore`/`rawMax` hold the point arithmetic
and `score()`/`maxScore()` report a normalised **0-100**, which the topbar chip renders as
`X/100`.

Two source files sit one directory up and are inputs, not code to modify:

- `../OPENCODE-CHEATSHEET.md` — **the factual source of truth** for every OpenCode claim
  in the portal (CLI, slash commands, keybinds, `AGENTS.md`, `opencode.json`, skills
  bundle structure, permissions). Verify against it rather than from memory.
- `../opencode-cheatsheet.html` — the design system the portal's palette came from.

## Commands

There is no build, test framework, or lint config — deliberately, since the spec forbids
dependencies. These are the real verification commands:

```bash
# Open it (this IS the run step — never serve it; file:// is the requirement)
start opencode-lab.html              # Git Bash / cmd
Invoke-Item opencode-lab.html        # PowerShell

# Syntax-check the inline JavaScript
node -e "require('fs').writeFileSync('.check.js',require('fs').readFileSync('opencode-lab.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1])" && node --check .check.js && rm .check.js

# Offline integrity — must print nothing
grep -nE '(src|href)="https?://|@import|fetch\(|XMLHttpRequest|WebSocket' opencode-lab.html
```

The only permitted `http` strings in the file are the SVG namespace inside the `data:`
favicon and `127.0.0.1` curl examples in lesson prose.

### Testing behaviour without a browser

There is no test runner. To exercise the logic, extract the `<script>` block and run it in
Node against a small DOM stub, then drive `App.render()` by setting `location.hash`:

```js
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];
// stub: localStorage, document.getElementById -> fake elements with innerHTML/classList/dataset,
//       document.createElement, window.matchMedia/scrollTo/scrollY, location, Blob, URL
new Function(code + ';globalThis.__lab={App,Store,Scorer,Quiz,CHAPTERS,TOPICS,TEMPLATES,Render,Search};')();
```

That harness is what caught the achievement bug noted below. Worthwhile assertions: every
route renders without `undefined`/`[object Object]`, markup tag counts balance per route,
no duplicate element IDs, code-block count equals copy-button count, and a full quiz
playthrough.

## Architecture

`<style>` → markup shell → `<script>`, in that order, one of each. The script is divided
by banner comments into numbered regions; **navigate by those banners, not line numbers**:

```
1. CONTENT DATA   CHAPTERS, TOPICS, QUIZ_BANK, TEMPLATES, CHEATSHEETS, ACHIEVEMENTS
2. STORE          one localStorage key, subscribe/notify
3. SCORER         all derived numbers, pure over state
4. RENDER         esc/md, codeBlock, blocks, and one function per view
5. QUIZ           one engine, two consumers
6. SEARCH         flattened index over chapters + topics
7. ROUTER + BOOT  hash routing, delegated events
```

### The central contract: data drives rendering

Learning content is **data**, never markup. `Render.chapter()` emits the spec's fixed
pedagogy order — why → objectives → concept → enterprise → exercise → expected →
validation → best practices → mistakes → summary → checkpoint → completion — for every
chapter. **Adding a chapter is appending one object to `CHAPTERS`; no rendering code
changes.** The same holds for topics, templates, cheat sheets and quiz questions.

Prose inside those objects is rendered by `blocks()`, which understands exactly five
shapes:

```js
{p:'text'}                       {list:['a','b']}
{code:{name:'label', body:'…'}}  {table:{head:[], rows:[[]]}}
{note:{kind:'tip|warn|danger|info|best', title:'…', body:'…'}}
```

Inline markup inside any string is `` `code` `` and `**bold**`, applied by `md()` — which
**escapes HTML first**, so all content is plain text and untrusted-looking strings are
safe. Never bypass `esc`/`md` to inject markup from the data layer.

### Authoring gotcha: single-quoted strings, not template literals

Content strings contain backticks (inline `` `code` `` markup) and `${}`-looking text, so
content is authored in **single-quoted JS strings** with `\'` escapes. Using template
literals for content will break the file. Multi-line code bodies use `\n`.

### State and scoring

One `localStorage` key, `opencode-lab-v1`, holding one object: `v`, `name`, `theme`,
`done`, `checks`, `bookmarks`, `checkpoints`, `quiz`, `collapsed`, `certDate`.
`Store.blank()` defines the shape — extend it there so old saved state merges forward via
`Object.assign`.

Note the split: **`Store` holds what must survive a reload; `Quiz` holds in-flight state**
(`Quiz.cp`, `Quiz.final`) that is intentionally lost on refresh, so a half-finished
assessment cannot be resumed.

`Scorer` is pure over that state: score, percent, minutes left, readiness level,
achievements, per-track progress. Nothing derived is stored, so there is no cache to
invalidate.

## Invariants that are easy to break

These were deliberate decisions with tests behind them. Changing any of them is a product
change, not a refactor:

- **`AGENTS.md` is plural everywhere.** The singular is never loaded by OpenCode and is
  taught only as a documented Common Mistake. The spec text still says `AGENT.md` in
  several places; the user settled this — read all of them as plural.
- **`App.render()` only scrolls to top on an actual route change** and restores scroll
  position otherwise (`this.lastRoute`, `moved`). Ticking a step or completing a chapter
  must not jump the page.
- **Chapter checkpoints stay open until answered correctly.** A wrong answer flags the
  question, disables that option, and leaves the others live; the explanation appears only
  once solved; points are banked only for first-attempt hits, once all questions are
  solved. The **Final Assessment is different on purpose** — one answer per question, with
  a whole-quiz retake, otherwise every score would be 100% and the certificate worthless.
- **`enterprise` achievement implies all others are unlocked.** A certificate showing
  "Enterprise Ready" beside a locked "First Prompt" reads as broken, which is why
  `first-prompt` also accepts a completed chapter.
- **The certificate is withheld** until all 14 chapters are complete *and* the assessment
  is passed at ≥80%; `certDate` is stamped on first print and must stay stable on reprint.
- **Copy buttons need the `execCommand` fallback** — `file://` is not always a secure
  context, so `navigator.clipboard` may be absent.
- **Tables live in `.table-wrap` and code in `.code pre`**, both `overflow-x: auto`. The
  page body must never scroll horizontally.
- **Print forces the light palette** and hides `.no-print` chrome so the certificate fits
  one page.

## Adding content

- **A chapter** — append to `CHAPTERS` with every field the other chapters have (`why`,
  `objectives`, `concept`, `enterprise`, `exercise`, `expected`, `validation`,
  `bestPractices`, `mistakes`, `summary`, `checkpoint`, `minutes`, `difficulty`, `track`).
  `track` groups it in the sidebar and on the dashboard's knowledge-area bars.
- **Quiz questions** — 4 options, a correct index, and an explanation that says *why the
  right answer is right and the plausible wrong one is wrong*. Tag `topic` with one of the
  13 required topics.
- **A template** — `{file, group, desc, body}`; the body is a skeleton with `<angle
  bracket>` prompts, not a finished document.

The lab's continuous scenario is one broken FastAPI service, `orders-api`, introduced in
Chapter 1 with deliberate defects (SQL string concatenation, hardcoded token, float money,
`getOrders` beside `get_order`, no tests). Later chapters depend on those specific defects
— changing the scaffold in Chapter 1 breaks exercises in Chapters 7 through 14.
