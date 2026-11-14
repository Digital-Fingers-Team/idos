# IDOS — Immediate Diagnosis Of Symptoms

**Live:** https://idos.dfteam-eg.com

IDOS is a hospital system in Arabic (RTL). It starts with a **preliminary symptom check** that understands
Egyptian colloquial Arabic, then covers the rest of the patient journey: appointments, a medical record, and
messages between patient and doctor, plus an admin panel for the hospital.
The symptom check is triage guidance. It is **not** a diagnosis, and the doctor makes the final decision.

## What's inside

| Role | Can do |
|---|---|
| Visitor | Symptom checker (free text or picking from a list), with emergency warnings and a suggested department |
| Patient | Book with a doctor in the suggested department, view and cancel appointments, view the medical record, message their doctors |
| Doctor | Today's schedule, confirm or reject bookings, record visits (vitals, diagnosis, treatment), patient file including the patient's symptom checks |
| Admin | Hospital statistics, users (add doctors, suspend, delete), all appointments, knowledge-base browser, data export, demo reset |

Demo accounts (password `idos1234`): `patient@idos.com`, `hatem@idos.com` (doctor), `amr@idos.com` (admin).
The login page also has one-click demo buttons.

## How the symptom matcher works (`js/engine.js`)

1. **Canonical vocabulary.** The original 124-disease list wrote the same symptom many ways
   ("آلام البطن" / "ألم في البطن" / "مغص" …). `tools/build_kb.py` merges 552 spellings into 425 symptom concepts.
2. **Understanding input** (`js/lexicon.js`). In order: exact match → alias → Egyptian phrase lexicon
   (310 phrases, "زوري بيوجعني" → ألم الحلق) → **body part × condition rules** (68 rules: any phrase containing an ear
   word and a whistling/ringing word, such as "ودني بتصفر" or "صفارة في ودني", maps to طنين الأذن) → fuzzy token
   overlap. All of these run after Arabic normalisation, article stripping and 278 word-level synonyms (وجع→ألم, ودني→أذن, وارمة→تورم …).
   Free text is split on commas and "و".
3. **Ranking.** IDF weights make rare symptoms count more than common ones. The score is the mean of
   precision (how much of the complaint the disease explains) and recall (how much of the disease profile is present).
4. **Red flags first.** Dangerous combinations, such as chest pain with breathlessness or stroke signs, show an
   emergency banner whatever the ranking says.

## Evaluation (reproducible)

```bash
npm test               # unit tests
npm run eval           # synthetic cases from the knowledge base vs. the original 2026-04 algorithm
npm run vignettes      # colloquial development vignettes
npm run heldout        # the frozen held-out set v2 (do not tune the lexicon against it)
npm run dept           # suggested-department accuracy (add -- --heldout for v2)
```

| Test | Original algorithm top-3 | IDOS top-3 |
|---|---|---|
| Synthetic, 3 symptoms + 1 unrelated (n=1240) | 91.1% | 98.1% (+7.3 pts, 95% CI 5.8–8.8) |
| Synthetic, 2 symptoms (n=1240) | 79.2% | 91.3% |
| Colloquial held-out set v1 (n=20, lexicon v1) | 40.8% | 80.0% |
| Colloquial held-out set **v2** (n=30, committed before lexicon v2 in e27ab9e) | 29.3% | **86.7%** |

Lexicon v1 left 37% of held-out v1 phrases not understood. Lexicon v2 (rules + 136 more phrases) understands 97.9% of
the phrases in held-out v2, up from 45.8%. Held-out v1 was used to build lexicon v2, so it now counts as development
data. The remaining v2 misses are ranking or knowledge-base problems, not vocabulary.
The cases and the lexicon were written by the same team, so real patient text will score lower.
The full write-up is in the project paper.

### Suggested department

The department used to be a vote of the top 3 diseases, so a single broad complaint landed wherever the
smallest matching disease profile happened to sit (a lone "ألم الظهر" went to باطنة via vitamin D deficiency,
"قلق" to ENT via tinnitus). Now every matching disease votes (score⁸, normalised) and each broad complaint also
votes for the clinic that owns it (`js/specialty.js`), with a weight that fades as more symptoms are added.
`npm run dept`:

| Test | Top-3 vote | Now |
|---|---|---|
| One quick-pick chip (n=50) | 46% | 100% |
| Two chips of the same clinic (n=140) | 65.7% | 100% |
| Synthetic, 2–4 symptoms of one disease (n=2480) | 89.8% | 93.3% |
| Dev vignettes (n=50) | 96% | 98% |
| Held-out vignettes v2, run once after tuning (n=30) | 86.7% | 93.3% |

Every clinic the checker can suggest now has a doctor to book with (طوارئ shows a call button instead).

## Running locally

It is a static site with no build step:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Data is stored in the browser's `localStorage` (no server). Each browser gets its own copy of the demo hospital.
A production deployment needs a backend: shared database, server-side authentication, audit log.

## Layout

```
index.html, 404.html         app shell; 404 redirects old *.html links
css/app.css                  the only stylesheet (light and dark)
js/app.js                    router and layout      js/store.js   data and auth (localStorage, SHA-256 + salt)
js/engine.js                 symptom matcher        js/seed.js    demo hospital
js/views/*.js                public, checker, patient, doctor, admin, shared (messages, profile)
data/kb.js                   generated knowledge base     data/source/diseases.json   original list
tools/                       build_kb.py, eval.mjs, vignettes*.mjs, engine.test.mjs, results JSON
```

The previous multi-page version is kept on the `legacy` branch.

Digital Fingers Team.
