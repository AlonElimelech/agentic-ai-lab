# OpenCode Labs

Two self-contained training portals that teach an AI-assisted development workflow with
OpenCode. Each is a **single HTML file** — no build step, no package manager, no
framework, no CDN, no external fonts or images. Open one from `file://` on an air-gapped
machine and it works fully, including progress saving, quizzes, scoring and the printable
certificate.

| File | Format | Length | Scenario |
|---|---|---|---|
| `opencode-lab.html` | 14 chapters, 6 tracks | ~7h 50m | Fix a deliberately broken FastAPI service, `orders-api` |
| `opencode-lab-express.html` | 7 modules | 60 min | Build a tic-tac-toe game end to end |

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

**Express (60 minutes)** — the fast path. Seven timed modules that walk one complete loop
on a small greenfield project: context → task → plan → build → review → validate →
skills. Good as a lunch-and-learn or a first exposure.

1. Context Before Code — 8 min
2. A Task, Not a Prompt — 9 min
3. Plan Before Code — 7 min
4. Build It — 10 min
5. Review What You Got — 10 min
6. Validate the Edges — 9 min
7. Skills and Best Practices — 7 min

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

Alongside the chapters the full lab carries a reference section (13 topics), copy-ready
templates for the files the course teaches you to write, cheat sheets, a searchable index
across chapters and topics, achievements, and a final assessment.

## Progress, scoring and the certificate

Progress lives in one `localStorage` key, `opencode-lab-v1`, on the machine that opened
the file. Nothing is transmitted anywhere. Clearing site data for `file://` resets the
course.

Two quiz behaviours, deliberately different:

- **Chapter checkpoints** stay open until you answer correctly. A wrong answer flags the
  question and disables that option; the explanation appears only once solved. Points are
  banked for first-attempt hits.
- **The final assessment** takes one answer per question, with a whole-quiz retake. Making
  it forgiving would put every learner at 100% and make the certificate meaningless.

The certificate is withheld until **all 14 chapters are complete and the final assessment
is passed at 80% or better**. It is dated on first print and that date stays stable on
reprint. Printing forces the light palette and hides navigation chrome so it fits one
page.

In-flight quiz state is intentionally *not* saved — refreshing mid-assessment loses it, so
a half-finished assessment cannot be resumed.

## Structure of the files

Each file is `<style>` → markup shell → `<script>`, one of each. The script is divided by
banner comments into numbered regions; navigate by those banners rather than line numbers.

```
1. CONTENT DATA   chapters, topics, quiz bank, templates, cheat sheets, achievements
2. STORE          one localStorage key, subscribe/notify
3. SCORER         all derived numbers, pure over state
4. RENDER         escaping, markdown, code blocks, one function per view
5. QUIZ           one engine, two consumers
6. SEARCH         flattened index over chapters + topics
7. ROUTER + BOOT  hash routing, delegated events
```

The central contract: **learning content is data, never markup.** One renderer emits the
fixed pedagogy order for every chapter, so adding a chapter means appending one object to
`CHAPTERS` — no rendering code changes. Prose blocks understand five shapes (`p`, `list`,
`code`, `table`, `note`), and inline `` `code` ``/`**bold**` is applied after HTML
escaping, so content is always plain text.

Content strings are authored in **single-quoted JS strings**, not template literals —
the content itself contains backticks and `${}`-looking text.

## Verifying a change

There is no test runner or linter, by design. These are the real checks:

```bash
# Syntax-check the inline JavaScript
node -e "require('fs').writeFileSync('.check.js',require('fs').readFileSync('opencode-lab.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1])" \
  && node --check .check.js && rm .check.js

# Offline integrity — must print nothing
grep -nE '(src|href)="https?://|@import|fetch\(|XMLHttpRequest|WebSocket' opencode-lab.html
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
