// Synthetic evaluation of the IDOS matcher against the original (2026-04) algorithm.
//   node tools/eval.mjs            -> prints tables, writes tools/eval-results.json
// Cases are generated from the ORIGINAL disease list with its original spellings, so the
// test also measures how well each engine copes with the same symptom written different ways.
import { readFileSync, writeFileSync } from "node:fs";
import * as E from "../js/engine.js";

const RAW = JSON.parse(readFileSync(new URL("../data/source/diseases.json", import.meta.url), "utf8"));
const CANON = E.DISEASES; // same order, ids 1..N

/* ---------- seeded RNG ---------- */
let seed = 20261108;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const sample = (arr, k) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, k); };

/* ---------- baseline: the original diagnosis.js scoring ---------- */
const oldNorm = (t) => t.toString().trim().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[ً-ْ]/g, "");
function oldMatch(user, dis) {
  const u = oldNorm(user), d = oldNorm(dis);
  if (u === d || d.includes(u) || u.includes(d)) return true;
  const uw = u.split(" ").filter((w) => w.length > 3), dw = d.split(" ").filter((w) => w.length > 3);
  return uw.some((w) => dw.includes(w));
}
function baselineScores(symptoms) {
  return RAW.map((d) => {
    const matched = symptoms.filter((s) => d.symptoms.some((ds) => oldMatch(s, ds))).length;
    return matched ? (matched / d.symptoms.length) * 0.5 + (matched / symptoms.length) * 0.5 : 0;
  });
}

/* ---------- IDOS variants (for ablation) ---------- */
const N = CANON.length;
const df = new Map();
for (const d of CANON) for (const s of d.symptoms) df.set(s, (df.get(s) || 0) + 1);
const w = (s) => Math.log(1 + N / (df.get(s) || N));
function idosScores(canonSymptoms, { weighted = true, f1 = true } = {}) {
  const U = [...new Set(canonSymptoms)];
  const wt = weighted ? w : () => 1;
  const wU = U.reduce((a, s) => a + wt(s), 0);
  return CANON.map((d) => {
    const M = d.symptoms.filter((s) => U.includes(s));
    if (!M.length) return 0;
    const wM = M.reduce((a, s) => a + wt(s), 0), wD = d.symptoms.reduce((a, s) => a + wt(s), 0);
    const p = wM / wU, r = wM / wD;
    return f1 ? (2 * p * r) / (p + r) : 0.5 * p + 0.5 * r;
  });
}
const resolveAll = (raw) => raw.map((s) => E.resolve(s)?.symptom).filter(Boolean);

/* ---------- metrics with fair tie handling ---------- */
// Expected top-k hit under random tie-breaking: g strictly better, t tied with the truth.
function hit(scores, truth, k) {
  const ts = scores[truth];
  if (ts <= 0) return 0;
  let g = 0, t = 0;
  scores.forEach((s, i) => { if (i !== truth) { if (s > ts + 1e-12) g++; else if (Math.abs(s - ts) <= 1e-12) t++; } });
  return Math.max(0, Math.min(1, (k - g) / (t + 1)));
}
function rr(scores, truth) {
  const ts = scores[truth];
  if (ts <= 0) return 0;
  let g = 0, t = 0;
  scores.forEach((s, i) => { if (i !== truth) { if (s > ts + 1e-12) g++; else if (Math.abs(s - ts) <= 1e-12) t++; } });
  let sum = 0; for (let j = 0; j <= t; j++) sum += 1 / (g + 1 + j);
  return sum / (t + 1);
}

/* ---------- case generation ---------- */
const allRaw = [...new Set(RAW.flatMap((d) => d.symptoms))];
function makeCases({ k, noise, reps = 10 }) {
  const cases = [];
  RAW.forEach((d, i) => {
    if (d.symptoms.length < k) return;
    for (let r = 0; r < reps; r++) {
      const s = sample(d.symptoms, k);
      for (let n = 0; n < noise; n++) {
        let x; do { x = allRaw[Math.floor(rnd() * allRaw.length)]; } while (d.symptoms.includes(x));
        s.push(x);
      }
      cases.push({ truth: i, raw: s });
    }
  });
  return cases;
}

const ENGINES = {
  "Baseline (original 2026-04)": (c) => baselineScores(c.raw),
  "IDOS: canonical vocabulary only": (c) => idosScores(resolveAll(c.raw), { weighted: false, f1: false }),
  "IDOS: + IDF weights (shipped)": (c) => idosScores(resolveAll(c.raw), { weighted: true, f1: false }),
  "IDOS: + IDF, F1 combination": (c) => idosScores(resolveAll(c.raw), { weighted: true, f1: true }),
};

const SCENARIOS = [
  { name: "2 symptoms", k: 2, noise: 0 },
  { name: "3 symptoms", k: 3, noise: 0 },
  { name: "4 symptoms", k: 4, noise: 0 },
  { name: "3 symptoms + 1 unrelated", k: 3, noise: 1 },
  { name: "4 symptoms + 2 unrelated", k: 4, noise: 2 },
];

const results = [];
for (const sc of SCENARIOS) {
  const cases = makeCases(sc);
  for (const [name, fn] of Object.entries(ENGINES)) {
    let t1 = 0, t3 = 0, t5 = 0, mrr = 0;
    for (const c of cases) {
      const s = fn(c);
      t1 += hit(s, c.truth, 1); t3 += hit(s, c.truth, 3); t5 += hit(s, c.truth, 5); mrr += rr(s, c.truth);
    }
    const n = cases.length;
    results.push({ scenario: sc.name, engine: name, n, top1: t1 / n, top3: t3 / n, top5: t5 / n, mrr: mrr / n });
  }
}

// Bootstrap 95% CI for the headline difference (shipped vs baseline, top-3, scenario "3 symptoms + 1 unrelated")
function bootstrapDiff(sc, a, b, B = 1000) {
  seed = 777;
  const cases = makeCases(sc);
  const da = cases.map((c) => hit(ENGINES[a](c), c.truth, 3)), db = cases.map((c) => hit(ENGINES[b](c), c.truth, 3));
  const diffs = [];
  for (let i = 0; i < B; i++) {
    let s = 0;
    for (let j = 0; j < cases.length; j++) { const x = Math.floor(rnd() * cases.length); s += da[x] - db[x]; }
    diffs.push(s / cases.length);
  }
  diffs.sort((x, y) => x - y);
  return { mean: da.reduce((x, y) => x + y) / da.length - db.reduce((x, y) => x + y) / db.length, lo: diffs[Math.floor(B * 0.025)], hi: diffs[Math.floor(B * 0.975)], n: cases.length };
}
const ci = bootstrapDiff(SCENARIOS[3], "IDOS: + IDF weights (shipped)", "Baseline (original 2026-04)");

// Sanity: the engine the app ships must rank exactly like the "shipped" variant here.
for (const c of makeCases({ k: 3, noise: 1, reps: 1 }).slice(0, 60)) {
  const syms = resolveAll(c.raw), mine = idosScores(syms, { weighted: true, f1: false });
  for (const r of E.diagnose(syms, { limit: 3 })) if (Math.abs(r.score - mine[r.disease.id - 1]) > 1e-9) throw new Error("engine/eval mismatch");
}
// Vocabulary statistics
const rawVocab = new Set(RAW.flatMap((d) => d.symptoms));
const resolvable = [...rawVocab].filter((s) => E.resolve(s)).length;
const out = { generated: new Date().toISOString(), diseases: RAW.length, rawSymptoms: rawVocab.size, canonicalSymptoms: E.SYMPTOMS.length, rawResolvable: resolvable, results, headlineCI: ci };
writeFileSync(new URL("./eval-results.json", import.meta.url), JSON.stringify(out, null, 1));

const pct = (x) => (x * 100).toFixed(1).padStart(5);
for (const sc of SCENARIOS) {
  console.log(`\n${sc.name}  (n=${results.find((r) => r.scenario === sc.name).n})`);
  console.log("  engine".padEnd(36), " top1  top3  top5   MRR");
  for (const r of results.filter((r) => r.scenario === sc.name)) console.log("  " + r.engine.padEnd(34), pct(r.top1), pct(r.top3), pct(r.top5), r.mrr.toFixed(3));
}
console.log(`\nTop-3 gain, shipped vs baseline (3 + 1 unrelated): ${(ci.mean * 100).toFixed(1)} pts, 95% CI [${(ci.lo * 100).toFixed(1)}, ${(ci.hi * 100).toFixed(1)}]`);
console.log(`Vocabulary: ${out.rawSymptoms} raw spellings -> ${out.canonicalSymptoms} canonical symptoms; ${resolvable}/${out.rawSymptoms} raw spellings resolve.`);
