# OpenCode Labs

Two self-contained training portals that teach an AI-assisted development workflow with
OpenCode. Each is a **single HTML file** — no build step, no package manager, no
framework, no CDN, no external fonts or images. Open one from `file://` on an air-gapped
machine and it works fully, including progress saving, quizzes and scoring.

| File | Format | Length | Scenario |
|---|---|---|---|
| `opencode-lab.html` | 14 chapters, 6 tracks | ~7h 50m | Fix a deliberately broken FastAPI service, `orders-api` |
| `opencode-lab-express.html` | 8 modules | 60 min | Build a tic-tac-toe game end to end |

The two are siblings, not versions of each other. They share the same block renderer and
the same Store/Scorer/Router/Quiz shape, but each keeps its own `localStorage` key so
progress in one can never overwrite the other.

## Running

There is no server and no build. Opening the file **is** the run step.

```bash
start opencode-lab.html            # Git Bash / cmd
```

```powershell
Invoke-Item opencode-lab.html      # PowerShell
```

Do not serve it over HTTP — `file://` is the requirement, not a fallback.

## Which one to take

**Express (60 minutes)** — the fast path. Eight timed modules that walk one complete loop
on a small greenfield project: context → task → plan → build → review → validate →
skills → practices. Good as a lunch-and-learn or a first exposure.

1. Context Before Code — 8 min
2. A Task, Not a Prompt — 9 min
3. Plan Before Code — 7 min
4. Build It — 10 min
5. Review What You Got — 10 min
6. Validate the Edges — 9 min
7. Skills: Reusable Procedures — 4 min
8. Best Practices — 3 min

A module cannot be marked complete until every one of its hands-on steps is ticked, and
unticking a step afterwards puts the module back to incomplete — so "7 of 8 modules" always
means the work was actually done.

From Module 4 on, commits are made the way they are made in a real repository: the agent
proposes the exact `git` command and message, you read it, and only then approve — with the
hand-typed equivalent shown alongside.

Express has checkpoints and a final quiz, but no search, no templates and no certificate —
it points at the full lab for those. Its final passes at **90%** (9 of 10), and a pass sets
off a short burst of confetti, suppressed when the browser asks for reduced motion.

**Full lab (~8 hours)** — the enterprise course. Fourteen chapters across six tracks,
built on one continuous scenario: an existing FastAPI service carrying real defects (SQL
built by string concatenation, a hardcoded token, money stored as `float`, inconsistent
naming, no tests). Later chapters depend on those specific defects, so the chapters are
meant to be taken in order.

| # | Chapter | Track | Level | Time |
|---|---|---|---|---|
| 1 | Introduction: Your New Teammate | Foundations | Beginner | 20 min |
| 2 | Understanding Context | Foundations | Beginner | 25 min |
| 3 | Project Documentation as Infrastructure | Foundations | Intermediate | 30 min |
| 4 | AGENTS.md — Standing Orders | Context & Knowledge | Intermediate | 30 min |
| 5 | Knowledge Files: The Project Brain | Context & Knowledge | Intermediate | 35 min |
| 6 | Planning Before Coding | Building | Intermediate | 30 min |
| 7 | Implementation | Building | Intermediate | 35 min |
| 8 | Reviewing AI Work | Quality | Advanced | 35 min |
| 9 | Validation: Proving It Works | Quality | Advanced | 35 min |
| 10 | Git Workflow | Workflow | Intermediate | 30 min |
| 11 | Skills: Reusable Expertise | Workflow | Advanced | 40 min |
| 12 | Advanced Workflow | Mastery | Advanced | 40 min |
| 13 | Enterprise Best Practices | Mastery | Advanced | 25 min |
| 14 | Final Challenge | Mastery | Advanced | 60 min |

Every chapter follows the same fixed shape: why it matters → objectives → concept →
enterprise context → exercise → expected result → validation → best practices → common
mistakes → summary → checkpoint quiz.

Alongside the chapters, the full lab carries:

- **18 reference topics** — cross-cutting concepts (context engineering, decision records,
  security with AI, when *not* to use AI), each tagged and linked back to its chapter
- **15 copy-ready templates** — `AGENTS.md`, `architecture.md`, `decisions.md`,
  `known-issues.md`, `SKILL.md`, review and commit checklists, and more
- **52 checkpoint questions** across the chapters, plus a **79-question bank** behind the
  final assessment
- **8 achievements** and four readiness levels (Beginner → Practitioner → Advanced →
  Enterprise Ready)
- Search across chapters and topics, and printable cheat sheets

## Progress, scoring and the certificate

Express scores out of **100**, and the points are weighted so they add up to it exactly: a
step is 1, a module 4, a first-attempt checkpoint 1, a correct final answer 2 — 31 + 32 +
17 + 20. So `+1 point` on a step is literally one point of the hundred in the topbar chip.
The full lab still counts raw points against its own maximum.

Progress is stored locally, in one `localStorage` key per lab — `opencode-lab-v1` for the
full course and `opencode-express-v1` for express — on the machine that opened the file.
Nothing is transmitted anywhere. Clearing site data for `file://` resets progress.

Two quiz behaviours, deliberately different:

- **Chapter checkpoints** stay open until you answer correctly. A wrong answer flags the
  question and disables that option; the explanation appears only once solved. Points are
  banked for first-attempt hits.
- **Answer options are shuffled** when Express loads, so the correct answer is not always in
  the same place and a reload deals them differently.
- **The final assessment** takes one answer per question, with a whole-quiz retake. Making
  it forgiving would put every learner at 100% and make the certificate meaningless.

The certificate belongs to the full lab only, and is withheld until **all 14 chapters are
complete and the final assessment is passed at 80% or better**. It is dated on first print
and that date stays stable on reprint. Printing forces the light palette and hides
navigation chrome so it fits one page.

In-flight quiz state is intentionally *not* saved — refreshing mid-assessment loses it, so
a half-finished assessment cannot be resumed.

## Structure of the files

Each file is `<style>` → markup shell → `<script>`, one of each. The script is divided by
banner comments into numbered regions; navigate by those banners rather than line numbers.

```
opencode-lab.html                     opencode-lab-express.html
1. CONTENT DATA                       1. CONTENT DATA
2. STORE                              2. STORE
3. SCORER                             3. SCORER
4. RENDER                             4. RENDER
5. QUIZ                               5. QUIZ
6. SEARCH                             6. ROUTER + BOOT
7. ROUTER + BOOT
```

Express has no search region — that is the only structural difference.

The central contract: **learning content is data, never markup.** One renderer emits the
fixed pedagogy order for every chapter, so adding a chapter means appending one object to
`CHAPTERS` — no rendering code changes. Prose blocks understand five shapes (`p`, `list`,
`code`, `table`, `note`), and inline `` `code` ``/`**bold**` is applied after HTML
escaping, so content is always plain text.

Content strings are authored in **single-quoted JS strings**, not template literals —
the content itself contains backticks and `${}`-looking text.

## Verifying a change

There is no test runner or linter, by design. These are the real checks — run them against
whichever file you touched, or both:

```bash
# Syntax-check the inline JavaScript
for f in opencode-lab.html opencode-lab-express.html; do
  node -e "require('fs').writeFileSync('.check.js',require('fs').readFileSync('$f','utf8').match(/<script>([\s\S]*)<\/script>/)[1])" \
    && node --check .check.js && echo "$f OK"
done; rm -f .check.js

# Offline integrity — must print nothing
grep -nE '(src|href)="https?://|@import|fetch\(|XMLHttpRequest|WebSocket' \
  opencode-lab.html opencode-lab-express.html
```

The only permitted `http` strings are the SVG namespace inside the `data:` favicon and the
`127.0.0.1` curl examples in lesson prose.

To exercise the logic without a browser, extract the `<script>` block and run it in Node
against a small DOM stub, then drive rendering by setting `location.hash`. Worthwhile
assertions: every route renders without `undefined` or `[object Object]`, markup tags
balance per route, no duplicate element IDs, code-block count equals copy-button count,
and a full quiz playthrough.

## Constraints worth knowing before editing

These are product decisions, not incidental:

- **`AGENTS.md` is plural everywhere.** The singular is never loaded by OpenCode and
  appears only as a taught Common Mistake.
- **The two labs must keep separate storage keys.** Express deliberately does not reuse
  `opencode-lab-v1`.
- **Rendering scrolls to top only on a real route change**, otherwise it restores scroll
  position — ticking a step must not jump the page.
- **Copy buttons keep the `execCommand` fallback**, since `file://` is not always a secure
  context and `navigator.clipboard` may be absent.
- **Tables and code blocks scroll inside their own containers.** The page body never
  scrolls horizontally.
- The `orders-api` defects introduced in Chapter 1 are load-bearing for Chapters 7–14.

Factual claims about OpenCode itself — CLI, slash commands, keybinds, `AGENTS.md`,
`opencode.json`, skills, permissions — are verified against the OpenCode cheat sheet
rather than written from memory.

See `CLAUDE.md` for the working agreement and `.claude/INSTRUCTIONS.md` for the full
product specification.
