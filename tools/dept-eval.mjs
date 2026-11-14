// Department recommendation: earlier top-3 vote vs the current recommendDepartment.
//   node tools/dept-eval.mjs           dev sets (synthetic profiles, quick-pick chips, dev vignettes)
//   node tools/dept-eval.mjs --heldout adds held-out vignettes v2 (report only, never tune on it)
import { readFileSync, writeFileSync } from "node:fs";
import * as E from "../js/engine.js";
import { SYMPTOM_DEPT } from "../js/specialty.js";
import { VIGNETTES } from "./vignettes.mjs";
import { HELDOUT } from "./vignettes-heldout.mjs";

const D = E.DISEASES, byId = new Map(D.map((d) => [d.id, d]));
function oldTop3(U) {
  const votes = new Map();
  for (const r of E.diagnose(U, { limit: 3 })) votes.set(r.disease.department, (votes.get(r.disease.department) || 0) + r.score);
  return [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}
const resolveAll = (phrases) => [...new Set(phrases.map((p) => E.resolve(p)?.symptom).filter(Boolean))];

let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const synthetic = [];
for (const d of D) for (let k = 0; k < 20; k++) synthetic.push([[...d.symptoms].sort(() => rnd() - 0.5).slice(0, 2 + Math.floor(rnd() * 3)), [d.department]]);
const src = readFileSync(new URL("../js/views/checker.js", import.meta.url), "utf8");
const QUICK = Function(`return (${src.match(/const QUICK = (\{[\s\S]*?\n\});/)[1]})`)();
const chips = Object.values(QUICK).flat().filter((s) => SYMPTOM_DEPT.has(s));
const sets = {
  "synthetic 2-4 symptoms of one disease": synthetic,
  "full disease profiles": D.map((d) => [d.symptoms, [d.department]]),
  "one quick-pick chip": chips.map((s) => [[s], [SYMPTOM_DEPT.get(s)]]),
  "two chips of the same clinic": chips.flatMap((a) => chips.filter((b) => a < b && SYMPTOM_DEPT.get(a) === SYMPTOM_DEPT.get(b)).map((b) => [[a, b], [SYMPTOM_DEPT.get(a)]])),
  "dev vignettes (v0 + held-out v1)": [...VIGNETTES, ...HELDOUT].map((v) => [resolveAll(v.phrases), v.accept.map((i) => byId.get(i).department)]),
};
if (process.argv.includes("--heldout")) {
  const { HELDOUT_V2 } = await import("./vignettes-heldout-v2.mjs");
  sets["held-out vignettes v2"] = HELDOUT_V2.map((v) => [resolveAll(v.phrases), v.accept.map((i) => byId.get(i).department)]);
}
const acc = (set, f) => +(100 * set.filter(([U, ok]) => ok.includes(f(U))).length / set.length).toFixed(1);
const out = {};
for (const [name, set] of Object.entries(sets)) {
  out[name] = { n: set.length, top3Vote: acc(set, oldTop3), current: acc(set, E.recommendDepartment) };
  console.log(`${name.padEnd(40)} n=${String(set.length).padStart(4)}  top-3 vote ${String(out[name].top3Vote).padStart(5)}%  ->  now ${String(out[name].current).padStart(5)}%`);
}
writeFileSync(new URL("./dept-eval-results.json", import.meta.url), JSON.stringify(out, null, 1));
