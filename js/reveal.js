import { scramble, reducedMotion } from './scramble.js';

// The gate's real output: agent/policy.py:82,105,244,269 and agent/cli.py:212.
// Verdicts sit at column 50 so the three traces line up in a mono box.
export const TRACES = [
  { lines: ['> noesis "fix the failing tests in tests/"', 'act  read_file tests/test_parse.py', 'gate read_file classified read                    '], verdict: 'auto', at: 2 },
  { lines: ['act  run_shell rm -rf build', 'gate run_shell is destructive (recursive delete)  ', '     [a]llow  [s]ession  [d]eny  [q]uit >'], verdict: 'confirm', at: 1 },
  { lines: ['act  run_shell rm -rf ~', 'gate run_shell is deleting the root or home directory;', '     refused, and no approval can allow it        '], verdict: 'deny', at: 2 },
];

// Append one trace to `pre` as spans (one per line, plus the coloured verdict) and return
// the spans in reading order, each holding its final text in data-text with an empty body.
function appendTrace(pre, trace) {
  const spans = [];
  trace.lines.forEach((text, i) => {
    const line = document.createElement('span'); line.dataset.text = text; spans.push(line); pre.append(line);
    if (i === trace.at) {
      const v = document.createElement('span'); v.dataset.verdict = trace.verdict; v.dataset.text = trace.verdict; spans.push(v); pre.append(v);
    }
    if (i < trace.lines.length - 1) pre.append('\n');
  });
  return spans;
}

async function typeSpans(spans, { fire = false } = {}) {
  for (const s of spans) {
    await scramble(s, { duration: s.dataset.verdict ? 250 : 350 });
    if (fire && s.dataset.verdict) document.dispatchEvent(new CustomEvent('verdict', { detail: s.dataset.verdict }));
  }
}

function observeOnce(selector, fn, threshold = 0.4) {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); }
  }), { threshold });
  document.querySelectorAll(selector).forEach(el => io.observe(el));
}

// The hero box: one trace at a time, a new one every 6 s, only while visible and the tab is
// shown. A one-shot timeout between cycles, rAF only while text is actually changing.
function terminalCycle(pre) {
  if (reducedMotion()) return;
  let i = 0, visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.2 }).observe(pre);
  const cycle = async () => {
    if (visible && !document.hidden) {
      i = (i + 1) % TRACES.length;
      pre.textContent = '';
      await typeSpans(appendTrace(pre, TRACES[i]));
    }
    setTimeout(cycle, 6000);
  };
  setTimeout(cycle, 6000);
}

// The gate's trace cell: all three traces type in once, in order, firing a `verdict` event as
// each verdict resolves. Everything stays on screen afterwards.
async function typeTraceCell(pre) {
  pre.textContent = '';
  for (let i = 0; i < TRACES.length; i++) {
    if (i > 0) pre.append('\n\n');
    await typeSpans(appendTrace(pre, TRACES[i]), { fire: true });
    if (i < TRACES.length - 1) await new Promise(r => setTimeout(r, 700));
  }
}

export function revealHeader() {
  document.querySelectorAll('[data-scramble-onload]').forEach((el, i) => {
    // the wordmark holds <span class="accent">NOE</span>SIS; scramble each text node in place
    const nodes = [...el.childNodes].flatMap(n => n.nodeType === Node.TEXT_NODE ? [n] : [...n.childNodes].filter(c => c.nodeType === Node.TEXT_NODE));
    nodes.forEach(node => {
      const span = document.createElement('span'); span.textContent = node.textContent; node.replaceWith(span);
      setTimeout(() => scramble(span, { duration: 600 }), i * 60);
    });
  });
}

export function initReveal() {
  observeOnce('[data-scramble]', el => {
    // headings may hold <small> or coloured <span>s; scramble each text node in place
    const nodes = [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
      .concat([...el.children].filter(c => c.tagName !== 'SMALL').flatMap(c => [...c.childNodes].filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())));
    nodes.forEach(node => {
      const span = document.createElement('span'); span.textContent = node.textContent; node.replaceWith(span);
      scramble(span, { duration: 700 });
    });
  });
  if (!reducedMotion()) observeOnce('[data-trace]', typeTraceCell);   // the markup already holds all three traces
  document.querySelectorAll('[data-terminal]').forEach(terminalCycle);
}
