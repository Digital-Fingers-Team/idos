import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../js/engine.js";

test("every colloquial phrase and red-flag symptom exists in the vocabulary", () => {
  const v = new Set(E.SYMPTOMS);
  for (const s of Object.values(E.COLLOQUIAL)) assert.ok(v.has(s), s);
  for (const f of E.RED_FLAGS) for (const s of f.all || f.any) assert.ok(v.has(s), s);
});
test("Arabic normalisation", () => assert.equal(E.norm("أَلَمٌ في الْمَعِدَة"), "الم في المعده"));
test("resolves spellings, aliases and Egyptian phrasing", () => {
  assert.equal(E.resolve("آلام البطن").symptom, "ألم البطن");
  assert.equal(E.resolve("سخونية").symptom, "حمى");
  assert.equal(E.resolve("وجع في المفاصل").symptom, "ألم المفاصل");
  assert.equal(E.resolve("مفاصلي وارمة").symptom, "تورم المفاصل");
  assert.equal(E.resolve("كلام فاضي خالص"), null);
});
test("free text is split into symptoms", () => {
  const { found } = E.parseFreeText("عندي سخونية وكحة، وزوري بيوجعني");
  assert.deepEqual(found.map((f) => f.symptom), ["حمى", "سعال", "ألم الحلق"]);
});
test("ranking puts the intended disease first for a textbook case", () => {
  assert.equal(E.diagnose(["حرقة الصدر", "انتفاخ البطن", "غازات", "تجشؤ"])[0].disease.name, "عسر الهضم");
  assert.equal(E.diagnose([]).length, 0);
});
test("red flags fire on dangerous combinations only", () => {
  assert.equal(E.redFlags(["ألم الصدر", "ضيق التنفس"]).length, 1);
  assert.equal(E.redFlags(["ألم الصدر"]).length, 0);
});
test("a lone broad complaint goes to the clinic that owns it, not to باطنة", () => {
  const cases = { "صداع": "مخ وأعصاب", "ألم الظهر": "عظام", "قلق": "طب نفسي", "أرق": "طب نفسي", "حكة": "جلدية", "سعال": "صدرية",
    "خفقان": "قلب", "ألم الحلق": "أنف وأذن وحنجرة", "تبول متكرر": "مسالك بولية", "اصفرار الجلد": "كبد", "ألم المفاصل": "روماتيزم ومناعة", "إسهال": "باطنة" };
  for (const [s, d] of Object.entries(cases)) assert.equal(E.recommendDepartment([s]), d, s);
});
test("a full disease picture outweighs the complaint owner", () => {
  for (const d of E.DISEASES) assert.equal(E.recommendDepartment(d.symptoms), d.department, d.name);
  assert.equal(E.recommendDepartment([]), null);
});
