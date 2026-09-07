/* Checks for opencode-lab-express.html. Run: node test-express.js
 *
 * No framework and no dependencies, deliberately — the deliverable is one
 * offline HTML file, and this stays a plain script for the same reason.
 * It extracts the inline <script>, runs it against a small DOM stub, and
 * drives the app through its own delegated click handler, so what is
 * asserted is the real behaviour rather than a copy of it.
 */
const fs = require('fs');
const assert = require('assert');

const FILE = process.argv[2] || 'opencode-lab-express.html';

/* ---------- the stub ---------- */
function load() {
  const code = fs.readFileSync(FILE, 'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
  const saved = {};
  const listeners = {};
  const nodes = {};
  const el = () => ({
    innerHTML: '', textContent: '', style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute(k, v) { this[k] = v; }, getAttribute(k) { return this[k]; },
    appendChild() {}, removeChild() {}, remove() {},
    getContext: () => ({ clearRect() {}, save() {}, translate() {}, rotate() {}, fillRect() {}, restore() {}, set fillStyle(v) {} })
  });
  const on = (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); };
  const document = {
    documentElement: el(), body: el(),
    getElementById: id => nodes[id] || (nodes[id] = el()),
    createElement: () => el(),
    addEventListener: on,
    execCommand() { return true; }
  };
  const window = {
    matchMedia: () => ({ matches: false }),
    innerWidth: 1200, innerHeight: 800, scrollY: 0, scrollTo() {},
    addEventListener: on, location: { hash: '' }
  };
  const localStorage = {
    getItem: k => (k in saved ? saved[k] : null),
    setItem: (k, v) => { saved[k] = String(v); },
    removeItem: k => { delete saved[k]; }
  };

  const app = new Function(
    'window', 'document', 'localStorage', 'location', 'requestAnimationFrame', 'matchMedia', 'confirm',
    code + ';return {App,Store,Scorer,Quiz,Render,MODULES,QUIZ_BANK,POINTS,FINAL_COUNT,PASS_MARK,shuffleOptions};'
  )(window, document, localStorage, window.location, f => f, window.matchMedia, () => true);

  // The script boots itself on load, so the handler is already bound — calling
  // App.boot() again would register a second one and double every click.
  app.click = ds => listeners.click.forEach(fn => fn({ target: { closest: () => ({ dataset: ds }) } }));
  return app;
}

/* ---------- helpers ---------- */
const app = load();
const { Store, Scorer, Render, MODULES, QUIZ_BANK, POINTS, FINAL_COUNT, PASS_MARK } = app;
const blank = () => ({ checks: {}, done: {}, checkpoints: {}, quiz: { best: 0, taken: 0, last: 0 } });
const everything = () => {
  const s = blank();
  s.quiz.best = 100; s.quiz.taken = 1;
  MODULES.forEach(m => {
    m.exercise.steps.forEach((st, i) => { s.checks[m.id + ':' + i] = true; });
    s.done[m.id] = true;
    s.checkpoints[m.id] = { correct: m.checkpoint.length, total: m.checkpoint.length };
  });
  return s;
};
const say = m => console.log('  ok  ' + m);

/* ---------- content shape ---------- */
assert.deepStrictEqual(MODULES.map(m => m.id), [1, 2, 3, 4, 5, 6, 7, 8]);
MODULES.forEach(m => {
  ['title', 'short', 'minutes', 'why', 'objective', 'concept', 'exercise', 'expected', 'validation', 'watchOut', 'checkpoint']
    .forEach(f => assert.ok(m[f] !== undefined, 'module ' + m.id + ' missing ' + f));
  assert.ok(m.exercise.intro && m.exercise.steps.length, 'module ' + m.id + ' exercise');
  assert.ok(m.checkpoint.length >= 2, 'module ' + m.id + ' needs 2+ checkpoint questions');
});
assert.strictEqual(Scorer.totalMinutes(), 60, 'the hour must stay an hour');
say(MODULES.length + ' modules, ' + Scorer.totalSteps() + ' steps, ' + Scorer.totalCheckpoints()
  + ' checkpoints, ' + Scorer.totalMinutes() + ' minutes');

/* ---------- scoring: the weights add up to 100 ---------- */
assert.strictEqual(Scorer.rawMax(), 100, 'POINTS need retuning: raw max is ' + Scorer.rawMax());
assert.strictEqual(Scorer.maxScore(), 100);
assert.strictEqual(Scorer.score(blank()), 0);
assert.strictEqual(Scorer.score(everything()), 100);
const oneStep = blank(); oneStep.checks['1:0'] = true;
assert.strictEqual(Scorer.score(oneStep), POINTS.step, 'one step is worth its label');
say('score 0 -> 100, raw max ' + Scorer.rawMax() + ' (step ' + POINTS.step + ', module ' + POINTS.module
  + ', checkpoint ' + POINTS.checkpoint + ', final ' + POINTS.finalPerCorrect + ')');

/* ---------- every question is answerable and shuffled ---------- */
const questions = MODULES.flatMap(m => m.checkpoint).concat(QUIZ_BANK);
questions.forEach(q => {
  assert.strictEqual(q.options.length, 4, q.q);
  assert.ok(q.answer >= 0 && q.answer < 4, q.q);
  assert.ok(q.explain, q.q);
});
assert.ok(QUIZ_BANK.length >= FINAL_COUNT, 'bank smaller than the final draw');
// Both groups are shuffled — every question was authored with the answer second,
// so a group still sitting mostly at index 1 means its shuffle never ran.
[['checkpoints', MODULES.flatMap(x => x.checkpoint)], ['bank', QUIZ_BANK]].forEach(([name, group]) => {
  assert.strictEqual(new Set(group.map(q => q.answer)).size, 4, name + ': answers must use all four positions');
  assert.ok(group.filter(q => q.answer === 1).length < group.length * 0.6, name + ': answer still mostly second');
});
// and the shuffle keeps the right answer attached to its own text
const probe = { q: 'p', options: ['a', 'b', 'c', 'd'], answer: 1, explain: 'e' };
for (let i = 0; i < 200; i++) {
  app.shuffleOptions(probe);
  assert.strictEqual(probe.options[probe.answer], 'b', 'shuffle lost the correct answer');
  assert.deepStrictEqual([...probe.options].sort(), ['a', 'b', 'c', 'd']);
}
say(questions.length + ' questions, answers spread across all four positions, shuffle keeps them correct');

/* ---------- a module cannot be completed with steps outstanding ---------- */
const m = MODULES[3];                                   // Module 4, five steps
const keys = m.exercise.steps.map((st, i) => m.id + ':' + i);
assert.strictEqual(Scorer.stepsLeft(m, Store.state), m.exercise.steps.length);

app.click({ action: 'check', key: keys[0] });
assert.strictEqual(Scorer.stepsLeft(m, Store.state), m.exercise.steps.length - 1);
assert.strictEqual(Scorer.stepsLeft(MODULES[0], Store.state), MODULES[0].exercise.steps.length, 'other modules untouched');

app.click({ action: 'done', id: String(m.id) });
assert.ok(!Store.state.done[m.id], 'completing must be refused while steps remain');

keys.slice(1).forEach(k => app.click({ action: 'check', key: k }));
app.click({ action: 'done', id: String(m.id) });
assert.ok(Store.state.done[m.id], 'completes once every step is ticked');
assert.strictEqual(Scorer.score(Store.state), keys.length * POINTS.step + POINTS.module);

app.click({ action: 'check', key: keys[2] });
assert.ok(!Store.state.done[m.id], 'unticking a step reverts the module');

app.click({ action: 'check', key: keys[2] });
app.click({ action: 'done', id: String(m.id) });
app.click({ action: 'check', key: MODULES[0].id + ':0' });
app.click({ action: 'check', key: MODULES[0].id + ':0' });
assert.ok(Store.state.done[m.id], 'another module\'s steps must not affect this one');

assert.ok(Render.module(m, blank()).includes('data-id="' + m.id + '" disabled'), 'button disabled while steps remain');
assert.ok(!Render.module(m, everything()).includes('data-id="' + m.id + '" disabled'), 'enabled when the module is done');
say('completion gate holds from both directions, and the button says so');

/* ---------- the final is the last thing in the nav ---------- */
const src = fs.readFileSync(FILE, 'utf8');
const nav = src.slice(src.indexOf('renderNav()'), src.indexOf("getElementById('nav')"));
assert.ok(nav.indexOf('data-route="summary"') < nav.indexOf('data-route="quiz"'), 'summary comes before the final quiz');
assert.strictEqual(PASS_MARK, 90);
say('nav ends with the final quiz, pass mark ' + PASS_MARK + '%');

/* ---------- it must still work offline ---------- */
const online = src.match(/(src|href)="https?:\/\/|@import|fetch\(|XMLHttpRequest|WebSocket/g);
assert.ok(!online, 'external reference found: ' + online);
say('no external references');

console.log('\nall checks passed');
